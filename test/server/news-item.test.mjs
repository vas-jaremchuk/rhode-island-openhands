// The `news-item` piece type — reference/spec/03-backend.md §5. Required fields
// and the excerpt limit fail the save with a field error, the seed publishes the
// three Figma cards newest first, and the admin list carries Title, Kind and
// Date columns.
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import {
  login, startApos, testDbPath
} from './helpers.mjs';

describe('news-item piece type', function () {
  this.timeout(180000);

  const db = testDbPath();
  let site;
  let jar;

  const anonReq = () => site.apos.task.getAnonReq();
  const newsModule = () => site.apos.modules['news-item'];

  // The REST route reports field errors as `data.errors`, one entry per field.
  const fieldError = (body, name) => (body.data?.errors || [])
    .find((error) => error.path === name);

  const validItem = (overrides = {}) => ({
    title: 'A test news item',
    kind: 'news',
    date: '2025-01-02',
    excerpt: 'A short excerpt.',
    link: 'https://www.organogenesis.com/',
    ...overrides
  });

  before(async () => {
    site = await startApos({ db });
    await site.apos.task.invoke('site:seed');
    jar = await login(site.url, 'admin', 'admin');
  });

  after(async () => {
    await site.stop();
  });

  it('seeds the three Figma cards newest first', async () => {
    const items = await newsModule().find(anonReq(), {}).toArray();

    assert.deepEqual(
      items.map((item) => item.date),
      [ '2025-12-18', '2025-11-10', '2025-04-08' ]
    );
    assert.deepEqual(
      items.map((item) => item.kind),
      [ 'news', 'event', 'news' ]
    );
    assert.deepEqual(
      items.map((item) => item.title),
      [
        'Organogenesis Unveils Plans for New Biomanufacturing Facility in Smithfield, RI',
        'The Organogenesis Team Celebrates The Completion of Phase I of Construction',
        'Organogenesis Unveils Plans for New Biomanufacturing Facility in Smithfield, RI'
      ]
    );
    assert.ok(
      items.every((item) => item.link === 'https://www.organogenesis.com/'),
      'every seeded link is the Q-11 default'
    );
  });

  it('creates no new items when the seed runs again', async () => {
    const first = await newsModule().find(anonReq(), {}).toCount();
    await site.apos.task.invoke('site:seed');
    assert.equal(await newsModule().find(anonReq(), {}).toCount(), first);
  });

  it('shows Title, Kind and Date in the admin list', async () => {
    const { columns } = newsModule().getBrowserData(site.apos.task.getReq());

    assert.deepEqual(
      columns.slice(0, 3).map((column) => [ column.name, column.label ]),
      [
        [ 'title', 'apostrophe:title' ],
        [ 'kind', 'Kind' ],
        [ 'date', 'Date' ]
      ]
    );
  });

  it('fails a save without a link and reports the field', async () => {
    const response = await jar.post('/api/v1/news-item', validItem({ link: '' }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, 'link')?.name, 'required');
  });

  it('fails a save whose excerpt is longer than 200 characters', async () => {
    const response = await jar.post('/api/v1/news-item', validItem({
      excerpt: 'x'.repeat(201)
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.ok(
      fieldError(body, 'excerpt'),
      `expected an error on excerpt, got ${JSON.stringify(body)}`
    );
  });

  it('accepts an excerpt of exactly 200 characters', async () => {
    const response = await jar.post('/api/v1/news-item', validItem({
      excerpt: 'x'.repeat(200)
    }));
    assert.equal(response.status, 200);
  });

  it('saves a valid item', async () => {
    const response = await jar.post('/api/v1/news-item', validItem());
    assert.equal(response.status, 200);

    const saved = await response.json();
    assert.equal(saved.kind, 'news');
    assert.equal(saved.newTab, false);
  });
});
