// The `site` module: the seed builds the demo content and is safe to run
// twice, `importImage` stores a piece whose attachment the site serves, and
// `site:reset` refuses to touch a production database.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  mkdir, rm, writeFile
} from 'node:fs/promises';
import {
  after, before, describe, it
} from 'mocha';
import {
  login, startApos, testDbPath
} from './helpers.mjs';

const ADMIN_PASSWORD = 'APOS_ADMIN_PASSWORD';

describe('site module', function () {
  this.timeout(180000);

  const db = testDbPath();
  let site;
  let savedAdminPassword;

  const publishedReq = () => site.apos.task.getReq({ mode: 'published' });
  const anonReq = () => site.apos.task.getAnonReq();

  async function counts() {
    return {
      users: await site.apos.user.find(publishedReq(), {}).toCount(),
      images: await site.apos.image.find(anonReq(), {}).toCount(),
      pages: await site.apos.page.find(anonReq(), {}).toCount()
    };
  }

  before(async () => {
    // The seed falls back to `admin` only when the variable is unset; a value
    // from the environment would make the admin/admin test lie.
    savedAdminPassword = process.env[ADMIN_PASSWORD];
    delete process.env[ADMIN_PASSWORD];
    site = await startApos({ db });
  });

  after(async () => {
    if (savedAdminPassword === undefined) {
      delete process.env[ADMIN_PASSWORD];
    } else {
      process.env[ADMIN_PASSWORD] = savedAdminPassword;
    }
    await site.stop();
  });

  it('seeds the admin, the images and a published home page', async () => {
    await site.apos.task.invoke('site:seed');

    const { users, images } = await counts();
    assert.equal(users, 1, 'one admin user');
    assert.ok(images > 0, 'the media library has the fixture images');

    // An anonymous request sees the home page, so the seed published it.
    const home = await site.apos.page.find(anonReq(), { slug: '/' }).toObject();
    assert.equal(home?.type, '@apostrophecms/home-page');
    assert.equal((await fetch(`${site.url}/`)).status, 200);
  });

  it('creates no new documents when it runs a second time', async () => {
    const first = await counts();
    await site.apos.task.invoke('site:seed');
    assert.deepEqual(await counts(), first);
  });

  it('creates an admin that /login accepts as admin/admin', async () => {
    const jar = await login(site.url, 'admin', 'admin');
    const whoami = await jar.get('/api/v1/@apostrophecms/login/whoami')
      .then((response) => response.json());
    assert.equal(whoami.username, 'admin');
  });

  it('imports an image with its title, alt and a served attachment', async () => {
    const title = 'Careers image (import test)';
    const alt = 'A scientist looking through a microscope';
    const image = await site.apos.modules.site
      .importImage(publishedReq(), 'fixtures/images/careers-image.jpg', {
        title,
        alt
      });

    assert.equal(image.title, title);
    assert.equal(image.alt, alt);

    const stored = await site.apos.image
      .find(publishedReq(), { slug: image.slug }).toObject();
    assert.ok(stored, 'the piece is stored under its slug');

    const url = site.apos.attachment.url(stored.attachment, { size: 'full' });
    const response = await fetch(new URL(url, site.url));
    assert.equal(response.status, 200, `${url} answers 200`);
    await response.arrayBuffer();
  });

  it('returns the existing piece when the same title is imported again', async () => {
    const title = 'Careers image (import test)';
    const options = {
      title,
      alt: 'A scientist looking through a microscope'
    };
    const file = 'fixtures/images/careers-image.jpg';

    const importImage = () => site.apos.modules.site
      .importImage(publishedReq(), file, options);
    const first = await importImage();
    const second = await importImage();
    assert.equal(second._id, first._id);
  });

  it('refuses site:reset in production and deletes nothing', async () => {
    const resetDb = testDbPath();
    await mkdir('data', { recursive: true });
    await writeFile(resetDb, '');
    await mkdir('public/uploads', { recursive: true });
    const sentinel = `public/uploads/reset-guard-${process.pid}.txt`;
    await writeFile(sentinel, 'keep me');

    try {
      const result = spawnSync(process.execPath, [ 'app', 'site:reset' ], {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          APOS_DB_URI: `sqlite://${resetDb}`
        },
        encoding: 'utf8',
        timeout: 120000
      });

      assert.notEqual(result.status, 0, 'the task exits non-zero');
      const output = `${result.stdout}${result.stderr}`;
      assert.match(output, /site:reset/);
      assert.match(output, /production/);
      assert.ok(existsSync(resetDb), 'the database file is untouched');
      assert.ok(existsSync(sentinel), 'uploads are untouched');
    } finally {
      await Promise.all([ '', '-wal', '-shm' ].map((suffix) => rm(resetDb + suffix, {
        force: true
      })));
      await rm(sentinel, { force: true });
    }
  });
});
