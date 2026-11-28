// The `college-partner` piece type — reference/spec/03-backend.md §5. The seed
// publishes the five Figma logos in strip order with their logo and alt text,
// and a save without a logo fails with a field error.
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import {
  login, startApos, testDbPath
} from './helpers.mjs';

describe('college-partner piece type', function () {
  this.timeout(180000);

  const db = testDbPath();
  let site;
  let jar;
  let image;

  const anonReq = () => site.apos.task.getAnonReq();
  const partnerModule = () => site.apos.modules['college-partner'];

  // The REST route reports field errors as `data.errors`, one entry per field.
  const fieldError = (body, name) => (body.data?.errors || [])
    .find((error) => error.path === name);

  const validPartner = (overrides = {}) => ({
    title: 'A test college',
    _logo: [ { _id: image._id } ],
    url: 'https://www.organogenesis.com/',
    ...overrides
  });

  before(async () => {
    site = await startApos({ db });
    await site.apos.task.invoke('site:seed');
    jar = await login(site.url, 'admin', 'admin');
    // The admin saves in draft mode, so the relationship must name the draft
    // variant of the image; the published id would not resolve there.
    image = await site.apos.image.find(site.apos.task.getReq(), {}).toObject();
  });

  after(async () => {
    await site.stop();
  });

  it('seeds the five Figma partners in logo-strip order', async () => {
    // The type defines no sort of its own — the education widget's `_partners`
    // relationship decides the display order — so read the seed's insertion
    // order.
    const partners = await partnerModule()
      .find(anonReq(), {})
      .sort({ createdAt: 1 })
      .toArray();

    assert.deepEqual(
      partners.map((partner) => partner.title),
      [
        'Brown University',
        'University of Rhode Island',
        'Rhode Island College',
        'Community College of Rhode Island',
        'Providence College'
      ]
    );
    assert.ok(
      partners.every((partner) => partner.url === 'https://www.organogenesis.com/'),
      'every seeded url is the Q-11 default'
    );
  });

  it('serves a logo for every seeded partner, with the partner name as alt', async () => {
    const partners = await partnerModule()
      .find(anonReq(), {})
      .sort({ createdAt: 1 })
      .toArray();

    assert.equal(partners.length, 5);
    for (const partner of partners) {
      assert.equal(partner._logo?.length, 1, `${partner.title} has one logo`);
      const logo = partner._logo[0];
      // Alt text is the partner name, with no "logo" suffix (issue #9).
      assert.equal(logo.alt, partner.title);
      assert.ok(!/logo/i.test(partner.title), `${partner.title} carries no "logo" suffix`);

      const url = site.apos.attachment.url(logo.attachment, { size: 'full' });
      const response = await fetch(new URL(url, site.url));
      assert.equal(response.status, 200, `${url} answers 200`);
      await response.arrayBuffer();
    }
  });

  it('creates no new partners when the seed runs again', async () => {
    const first = await partnerModule().find(anonReq(), {}).toCount();
    await site.apos.task.invoke('site:seed');
    assert.equal(await partnerModule().find(anonReq(), {}).toCount(), first);
  });

  it('shows the fields with labels and help text in the editor', () => {
    const field = (name) => partnerModule().schema.find((entry) => entry.name === name);

    assert.equal(field('title').label, 'Title');
    assert.match(field('title').help, /alt text/);
    assert.equal(field('_logo').label, 'Logo');
    assert.equal(field('_logo').required, true);
    assert.match(field('_logo').help, /Required/);
    assert.equal(field('url').label, 'URL');
    assert.match(field('url').help, /Optional/);
  });

  it('fails a save without a logo and reports the field', async () => {
    const response = await jar.post('/api/v1/college-partner', validPartner({
      _logo: undefined
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, '_logo')?.name, 'required');
  });

  it('fails a save whose logo does not resolve', async () => {
    const response = await jar.post('/api/v1/college-partner', validPartner({
      _logo: [ { _id: 'not-an-image-id' } ]
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, '_logo')?.name, 'required');
  });

  it('fails a save without a name and reports the field', async () => {
    const response = await jar.post('/api/v1/college-partner', validPartner({
      title: ''
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, 'title')?.name, 'required');
  });

  it('saves a partner without a url', async () => {
    const response = await jar.post('/api/v1/college-partner', validPartner({
      url: ''
    }));
    assert.equal(response.status, 200);

    const saved = await response.json();
    assert.ok(!saved.url, 'the url stays empty');
  });

  it('saves a valid partner', async () => {
    const response = await jar.post('/api/v1/college-partner', validPartner());
    assert.equal(response.status, 200);

    const saved = await response.json();
    assert.equal(saved.title, 'A test college');
    assert.equal(saved.url, 'https://www.organogenesis.com/');
    assert.equal(saved._logo[0]._id, image._id);
  });
});
