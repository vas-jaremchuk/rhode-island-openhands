// The `community-post` piece type — reference/spec/03-backend.md §5. Required
// fields fail the save with a field error, the seed publishes the three Figma
// posts newest first with their card image, and the relative-date formatter is
// exposed to templates.
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import {
  login, startApos, testDbPath
} from './helpers.mjs';

describe('community-post piece type', function () {
  this.timeout(180000);

  const db = testDbPath();
  let site;
  let jar;
  let image;

  const anonReq = () => site.apos.task.getAnonReq();
  const communityModule = () => site.apos.modules['community-post'];
  const globalModule = () => site.apos.modules['@apostrophecms/global'];

  // The REST route reports field errors as `data.errors`, one entry per field.
  const fieldError = (body, name) => (body.data?.errors || [])
    .find((error) => error.path === name);

  const validPost = (overrides = {}) => ({
    title: 'A test community post',
    excerpt: 'A short excerpt.',
    _image: [ { _id: image._id } ],
    postedAt: '2025-01-02',
    source: 'linkedin',
    authorName: 'Organogenesis',
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

  it('seeds the three Figma posts newest first', async () => {
    const posts = await communityModule().find(anonReq(), {}).toArray();

    assert.deepEqual(
      posts.map((post) => post.title),
      [
        'Organogenesis Congratulates Dr. Arthur-Paul Petrosinelli on His Appointment to the Rhode Island Board of Education',
        'New Biomanufacturing Facility Opened In Smithfield, RI',
        'Today, we had the honor of welcoming RI Governor Dan McKee to our new Smithfield facility'
      ]
    );
    assert.ok(
      posts[0].postedAt > posts[1].postedAt && posts[1].postedAt > posts[2].postedAt,
      'postedAt sorts the posts newest first'
    );
    assert.deepEqual(
      posts.map((post) => post.source),
      [ 'linkedin', 'linkedin', 'linkedin' ]
    );
    assert.ok(
      posts.every((post) => post.authorName === 'Organogenesis'),
      'every seeded post has the Organogenesis author'
    );
    assert.ok(
      posts.every((post) => post.url === 'https://www.organogenesis.com/'),
      'every seeded url is the Q-11 default'
    );
  });

  it('serves an image for every seeded post', async () => {
    const posts = await communityModule().find(anonReq(), {}).toArray();
    assert.equal(posts.length, 3);

    for (const post of posts) {
      assert.equal(post._image?.length, 1, `${post.title} has one image`);
      const url = site.apos.attachment.url(post._image[0].attachment, {
        size: 'full'
      });
      const response = await fetch(new URL(url, site.url));
      assert.equal(response.status, 200, `${url} answers 200`);
      await response.arrayBuffer();
    }
  });

  it('seeds the Global default avatar that posts fall back to', async () => {
    const global = await globalModule().findGlobal(site.apos.task.getReq({
      mode: 'published'
    }));
    assert.equal(global._defaultAvatar?.length, 1);
    assert.equal(global._defaultAvatar[0].title, 'Organogenesis avatar');
  });

  it('creates no new posts when the seed runs again', async () => {
    const first = await communityModule().find(anonReq(), {}).toCount();
    await site.apos.task.invoke('site:seed');
    assert.equal(await communityModule().find(anonReq(), {}).toCount(), first);
  });

  it('leaves the source and author defaults on a new instance', () => {
    const instance = communityModule().newInstance();
    assert.equal(instance.source, 'linkedin');
    assert.equal(instance.authorName, 'Organogenesis');
  });

  it('exposes relativeDate to templates', () => {
    const helpers = site.apos.template.templateApos;
    const helper = helpers.communityPost?.relativeDate ||
      helpers.modules['community-post'].relativeDate;

    assert.equal(typeof helper, 'function');
    assert.equal(helper('2026-06-09', new Date('2026-06-15T12:00:00Z')), '6d');
  });

  it('fails a save without an image and reports the field', async () => {
    const response = await jar.post('/api/v1/community-post', validPost({
      _image: undefined
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, '_image')?.name, 'required');
  });

  it('fails a save whose image does not resolve', async () => {
    const response = await jar.post('/api/v1/community-post', validPost({
      _image: [ { _id: 'not-an-image-id' } ]
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, '_image')?.name, 'required');
  });

  it('fails a save without a url and reports the field', async () => {
    const response = await jar.post('/api/v1/community-post', validPost({
      url: ''
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(fieldError(body, 'url')?.name, 'required');
  });

  it('fails a save whose excerpt is longer than 240 characters', async () => {
    const response = await jar.post('/api/v1/community-post', validPost({
      excerpt: 'x'.repeat(241)
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.ok(
      fieldError(body, 'excerpt'),
      `expected an error on excerpt, got ${JSON.stringify(body)}`
    );
  });

  it('accepts an excerpt of exactly 240 characters', async () => {
    const response = await jar.post('/api/v1/community-post', validPost({
      excerpt: 'x'.repeat(240)
    }));
    assert.equal(response.status, 200);
  });

  it('saves a valid post', async () => {
    const response = await jar.post('/api/v1/community-post', validPost());
    assert.equal(response.status, 200);

    const saved = await response.json();
    assert.equal(saved.postedAt, '2025-01-02');
    assert.equal(saved.source, 'linkedin');
    assert.equal(saved.authorName, 'Organogenesis');
    assert.equal(saved._image[0]._id, image._id);
  });
});
