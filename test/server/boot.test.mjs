// Foundation for every later server test: the site boots on a throwaway SQLite
// file, answers HTTP, logs an admin in, keeps that session across a restart and
// rejects a POST that has no CSRF cookie.
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import {
  createJar, leftoverTestDbs, login, startApos, testDbPath
} from './helpers.mjs';

const ADMIN = {
  username: 'admin',
  password: 'server-test-password',
  email: 'admin@organo-ri.test',
  title: 'Server Test Admin',
  role: 'admin'
};

describe('server boot', function () {
  this.timeout(60000);

  const db = testDbPath();
  let site;
  let adminJar;

  before(async () => {
    site = await startApos({ db });
    await site.apos.user.insert(site.apos.task.getReq(), { ...ADMIN });
  });

  after(async () => {
    await site.stop();
    assert.deepEqual(
      await leftoverTestDbs(),
      [],
      'the suite must not leave data/test-*.db files behind'
    );
  });

  it('boots the app modules without errors', () => {
    assert.ok(site.apos.modules['@apostrophecms/page'], 'page module is active');
    assert.equal(site.apos.shortName, 'organo-ri-test');
    assert.doesNotThrow(() => site.apos.schema.validateAllSchemas());
  });

  it('serves the home page', async () => {
    const response = await fetch(`${site.url}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<html/i);
  });

  it('logs the admin created in the test in through the API', async () => {
    adminJar = await login(site.url, ADMIN.username, ADMIN.password);

    const whoami = await adminJar.get('/api/v1/@apostrophecms/login/whoami')
      .then((response) => response.json());
    assert.equal(whoami.username, ADMIN.username);

    const pages = await adminJar.get('/api/v1/@apostrophecms/page');
    assert.equal(pages.status, 200);
  });

  it('rejects a POST without the CSRF cookie', async () => {
    // The login route is a CSRF exception; logout is not, so it proves the rule.
    const response = await createJar(site.url)
      .post('/api/v1/@apostrophecms/login/logout', {});
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.name, 'forbidden');
    assert.match(body.message, /CSRF/);
  });

  it('keeps the session across a restart on the same database file', async () => {
    const cookies = adminJar.cookies;
    await site.apos.destroy();
    site = await startApos({ db });

    // SQLite holds the session: the cookie jar from before the restart is still
    // logged in against the fresh process, which listens on a new free port.
    const restartedJar = createJar(site.url, cookies);
    const response = await restartedJar.get('/api/v1/@apostrophecms/login/whoami');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).username, ADMIN.username);
  });
});
