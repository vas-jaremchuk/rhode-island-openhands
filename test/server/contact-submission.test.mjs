// The `contact-submission` piece type — reference/spec/03-backend.md §5 and §8.
// Submissions are private to admins and editors, an editor can change only
// `status`, the title is generated, `meta` is captured by the service and never
// taken from input, and `site:purge-submissions --days=N` keeps the retention
// window (Q-7).
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import {
  login, startApos, testDbPath
} from './helpers.mjs';

describe('contact-submission piece type', function () {
  this.timeout(180000);

  const db = testDbPath();
  const DAY_MS = 24 * 60 * 60 * 1000;
  let site;
  let adminJar;
  let editorJar;
  let contributorJar;

  const submissionModule = () => site.apos.modules['contact-submission'];
  const adminReq = () => site.apos.task.getReq();

  const validSubmission = (overrides = {}) => ({
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    areaOfInterest: 'option-a',
    ...overrides
  });

  async function submit(overrides) {
    const response = await adminJar.post('/api/v1/contact-submission', validSubmission(overrides));
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return body;
  }

  const stored = (_id) => submissionModule()
    .find(adminReq(), { _id }).toObject();

  // `insert` always stamps `createdAt` with the current time, so an old
  // submission is made by moving the stamp afterwards.
  async function backdate(submission, days) {
    await site.apos.doc.db.updateOne({ _id: submission._id }, {
      $set: {
        createdAt: new Date(Date.now() - days * DAY_MS)
      }
    });
  }

  before(async () => {
    site = await startApos({ db });
    const req = adminReq();
    for (const user of [
      {
        username: 'admin',
        password: 'admin',
        title: 'Admin',
        role: 'admin'
      },
      {
        username: 'editor',
        password: 'editor-password',
        title: 'Editor',
        role: 'editor'
      },
      {
        username: 'contributor',
        password: 'contributor-password',
        title: 'Contributor',
        role: 'contributor'
      }
    ]) {
      await site.apos.user.insert(req, user);
    }
    adminJar = await login(site.url, 'admin', 'admin');
    editorJar = await login(site.url, 'editor', 'editor-password');
    contributorJar = await login(site.url, 'contributor', 'contributor-password');
  });

  after(async () => {
    await site.stop();
  });

  it('is not localized and can be created only by the service', () => {
    const options = submissionModule().options;
    assert.equal(options.localized, false);
    assert.equal(options.showCreate, false);
    assert.equal(options.quickCreate, false);
    assert.equal(options.viewRole, 'editor');
    assert.equal(options.editRole, 'editor');
    assert.equal(options.publicApiProjection, undefined);
  });

  it('gives every field a label and help text', () => {
    for (const name of [
      'title',
      'status',
      'fullName',
      'email',
      'areaOfInterest',
      'emailSent',
      'meta'
    ]) {
      const field = submissionModule().schema.find((entry) => entry.name === name);
      assert.ok(field, `${name} is in the schema`);
      assert.ok(field.label, `${name} has a label`);
      assert.ok(field.help, `${name} has help text`);
    }
    const meta = submissionModule().schema.find((candidate) => candidate.name === 'meta');
    for (const field of meta.schema) {
      assert.ok(field.label, `meta.${field.name} has a label`);
      assert.ok(field.help, `meta.${field.name} has help text`);
    }
  });

  it('answers an anonymous request with 403', async () => {
    const response = await fetch(new URL('/api/v1/contact-submission', site.url));
    assert.equal(response.status, 403);
  });

  it('answers a contributor with 403', async () => {
    const response = await contributorJar.get('/api/v1/contact-submission');
    assert.equal(response.status, 403);
  });

  it('sets the title from the full name and area of interest', async () => {
    const submission = await submit();

    assert.equal(submission.title, 'Ada Lovelace – option-a');
    assert.equal(submission.status, 'new');
    assert.equal(submission.emailSent, false);
    assert.equal(submission.aposLocale, undefined, 'no draft/published pair');
    assert.equal(submission.aposMode, undefined);
  });

  it('ignores a title in the request body', async () => {
    const submission = await submit({ title: 'Typed by hand' });
    assert.equal(submission.title, 'Ada Lovelace – option-a');
  });

  it('lists submissions for an editor', async () => {
    const response = await editorJar.get('/api/v1/contact-submission');
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(body.results.length > 0, 'the editor sees the submissions');
    assert.ok(
      body.results.every((result) => result.type === 'contact-submission'),
      'only submissions are listed'
    );
  });

  it('saves the status an editor sets to handled', async () => {
    const submission = await submit();

    const response = await editorJar.patch(`/api/v1/contact-submission/${submission._id}`, {
      status: 'handled'
    });
    assert.equal(response.status, 200);

    assert.equal((await stored(submission._id)).status, 'handled');
  });

  it('leaves the stored email alone when an editor patches it', async () => {
    const submission = await submit();

    const response = await editorJar.patch(`/api/v1/contact-submission/${submission._id}`, {
      email: 'changed@example.com'
    });
    assert.equal(response.status, 200);

    assert.equal((await stored(submission._id)).email, 'ada@example.com');
  });

  it('leaves the stored email alone when an editor puts a whole record', async () => {
    const submission = await submit();

    const response = await editorJar.put(`/api/v1/contact-submission/${submission._id}`, {
      ...submission,
      status: 'handled',
      email: 'changed@example.com',
      fullName: 'Changed Name'
    });
    assert.equal(response.status, 200);

    const updated = await stored(submission._id);
    assert.equal(updated.email, 'ada@example.com');
    assert.equal(updated.fullName, 'Ada Lovelace');
    assert.equal(updated.status, 'handled');
  });

  it('does not let a contributor change a submission', async () => {
    const submission = await submit();

    const response = await contributorJar.patch(`/api/v1/contact-submission/${submission._id}`, {
      status: 'handled'
    });
    assert.equal(response.status, 403);
    assert.equal((await stored(submission._id)).status, 'new');
  });

  it('never takes meta from input but keeps what the service assigns', async () => {
    const fromInput = await submit({
      meta: {
        ipHash: 'typed-into-the-request',
        userAgent: 'curl',
        referer: 'https://example.com/'
      }
    });
    assert.equal(fromInput.meta?.ipHash, '', 'the typed hash is not stored');

    const doc = submissionModule().newInstance();
    await submissionModule().convert(adminReq(), validSubmission(), doc);
    doc.meta = {
      ipHash: 'a'.repeat(64),
      userAgent: 'Mozilla/5.0',
      referer: 'https://www.organogenesis.com/'
    };
    const saved = await submissionModule().insert(adminReq(), doc);

    assert.equal((await stored(saved._id)).meta.ipHash, 'a'.repeat(64));
  });

  it('purges only the submissions older than --days', async () => {
    const recent = await submit({ fullName: 'Recent Visitor' });
    const old = await submit({ fullName: 'Old Visitor' });
    await backdate(recent, 10);
    await backdate(old, 40);

    const result = await site.apos.task.invoke('site:purge-submissions', {
      days: 30
    });
    assert.deepEqual(result, {
      days: 30,
      deleted: 1
    });

    assert.equal(await stored(old._id), undefined, 'the 40-day-old submission is gone');
    assert.ok(await stored(recent._id), 'the 10-day-old submission stays');
  });

  it('keeps a year by default (Q-7)', async () => {
    const kept = await submit({ fullName: 'Kept Visitor' });
    const expired = await submit({ fullName: 'Expired Visitor' });
    await backdate(kept, 300);
    await backdate(expired, 400);

    const result = await site.apos.task.invoke('site:purge-submissions');
    assert.deepEqual(result, {
      days: 365,
      deleted: 1
    });

    assert.equal(await stored(expired._id), undefined);
    assert.ok(await stored(kept._id));
  });

  it('refuses a --days that is not a non-negative integer', async () => {
    await assert.rejects(
      () => site.apos.task.invoke('site:purge-submissions', {
        days: 'soon'
      }),
      /--days must be a non-negative integer/
    );
  });
});
