// Server test harness: boots the real app (`app.js` module registry) on a
// throwaway SQLite file, and logs in over HTTP with a cookie jar.
//
// One Apostrophe instance per test file (see AGENTS.md and
// `.agents/skills/apostrophe-pitfalls`: a file, never `sqlite://:memory:`), so the
// `before`/`after` hooks of a test file own the instance and the suite runs serially.
import { randomUUID } from 'node:crypto';
import {
  mkdir, readdir, rm
} from 'node:fs/promises';
import apostrophe from 'apostrophe';
import { aposOptions } from '../../app.js';

const DB_DIR = 'data';
const SHORT_NAME = 'organo-ri-test';
const DB_SUFFIXES = [ '', '-wal', '-shm' ];

// Path of the SQLite file used by this run, in the project's usual `data/` folder.
export function testDbPath() {
  return `${DB_DIR}/test-${randomUUID()}.db`;
}

// Names of the throwaway databases currently on disk (`data/test-*.db*`).
export async function leftoverTestDbs() {
  const files = await readdir(DB_DIR).catch(() => []);
  return files.filter((file) => /^test-.*\.db(-wal|-shm)?$/.test(file)).sort();
}

async function removeDb(db) {
  await Promise.all(DB_SUFFIXES.map((suffix) => rm(db + suffix, { force: true })));
}

// Merge test overrides into the app's `modules` option, one level of `options` deep.
function mergeModules(base, extra) {
  const merged = structuredClone(base);
  for (const [ name, config ] of Object.entries(extra || {})) {
    merged[name] = {
      ...(merged[name] || {}),
      ...config,
      options: {
        ...(merged[name]?.options || {}),
        ...(config?.options || {})
      }
    };
  }
  return merged;
}

// Boots Apostrophe on a free port against `options.db` (a fresh file by default).
// Resolves to `{ apos, url, stop }`; `stop()` destroys Apostrophe and deletes the
// database file, its `-wal` and `-shm`. Call `apos.destroy()` yourself to restart on
// the same file, then `stop()` once the file is no longer needed (it is idempotent).
export async function startApos(options = {}) {
  const db = options.db || testDbPath();

  // `data/` is gitignored, so a checkout that has not run `npm run setup` lacks it.
  await mkdir(DB_DIR, { recursive: true });
  process.env.APOS_DB_URI = `sqlite://${db}`;
  // A free port: the express module lets the OS assign one when `port` is 0, and
  // the env variables and `data/port` would otherwise take precedence.
  delete process.env.PORT;
  delete process.env.ADDRESS;

  const apos = await apostrophe({
    ...aposOptions,
    shortName: SHORT_NAME,
    argv: {
      _: [],
      'ignore-orphan-modules': true
    },
    exit: 'throw',
    test: true,
    autoBuild: false,
    modules: mergeModules(aposOptions.modules, {
      '@apostrophecms/express': {
        options: {
          port: 0,
          address: 'localhost',
          session: {
            secret: SHORT_NAME
          }
        }
      }
    })
  });

  const { port } = apos.modules['@apostrophecms/express'];
  const url = `http://localhost:${port}`;

  // Keep `stop()` usable after a test destroyed the instance itself to restart
  // on the same file; destroying twice would close the server twice.
  const realDestroy = apos.destroy.bind(apos);
  let destroyed = false;
  apos.destroy = async () => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    await realDestroy();
  };

  return {
    apos,
    url,
    async stop() {
      await apos.destroy();
      await removeDb(db);
    }
  };
}

function cookieHeader(cookies) {
  return [ ...cookies ].map(([ name, value ]) => `${name}=${value}`).join('; ');
}

function storeCookies(cookies, response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [ pair, ...attributes ] = cookie.split(';');
    const separator = pair.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    const expired = attributes.some((attribute) => {
      const [ key, attributeValue = '' ] = attribute.split('=');
      const normalized = key.trim().toLowerCase();
      return normalized === 'max-age'
        ? Number(attributeValue) <= 0
        : normalized === 'expires' && Date.parse(attributeValue) <= Date.now();
    });
    if (expired) {
      cookies.delete(name);
    } else {
      cookies.set(name, value);
    }
  }
}

// Minimal cookie jar for HTTP requests against a booted server. `redirect` is
// `manual` so a 303 from a form post is observed instead of followed.
export function createJar(url, cookies = new Map()) {
  async function request(path, init = {}) {
    const response = await fetch(new URL(path, url), {
      redirect: 'manual',
      ...init,
      headers: {
        ...init.headers,
        cookie: cookieHeader(cookies)
      }
    });
    storeCookies(cookies, response);
    return response;
  }

  return {
    cookies,
    cookie(name) {
      return cookies.get(name);
    },
    get(path, init) {
      return request(path, {
        ...init,
        method: 'GET'
      });
    },
    post(path, body, init = {}) {
      return send('POST', path, body, init);
    },
    put(path, body, init = {}) {
      return send('PUT', path, body, init);
    },
    patch(path, body, init = {}) {
      return send('PATCH', path, body, init);
    }
  };

  function send(method, path, body, init = {}) {
    return request(path, {
      ...init,
      method,
      headers: {
        'content-type': 'application/json',
        ...init.headers
      },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  }
}

// Logs in over HTTP and returns the cookie jar, so later requests are
// authenticated. `GET /` first: Apostrophe sets the `<shortName>.csrf` cookie on
// every safe request. `session: true` asks for a session cookie; without it the
// login route issues a bearer token instead.
export async function login(url, username, password) {
  const jar = createJar(url);
  const page = await jar.get('/');
  if (page.status !== 200) {
    throw new Error(`login: GET / returned ${page.status}`);
  }
  const response = await jar.post('/api/v1/@apostrophecms/login/login', {
    username,
    password,
    session: true
  });
  if (response.status !== 200) {
    throw new Error(`login: ${username} returned ${response.status} ${await response.text()}`);
  }
  return jar;
}
