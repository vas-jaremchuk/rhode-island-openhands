// Boots the site on a throwaway SQLite file and checks that the home page answers 200.
// Usage: node scripts/smoke.mjs   (run by `npm test` until the server test suite exists)
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const port = 3900 + Math.floor(Math.random() * 90);
const db = `data/smoke-${process.pid}.db`;
const app = spawn(process.execPath, [ 'app.js' ], {
  env: {
    ...process.env,
    APOS_DB_URI: `sqlite://${db}`,
    PORT: String(port)
  },
  stdio: [ 'ignore', 'pipe', 'pipe' ]
});
let output = '';
app.stdout.on('data', (chunk) => (output += chunk));
app.stderr.on('data', (chunk) => (output += chunk));

let status = 0;
try {
  for (let i = 0; i < 120 && !status; i++) {
    await sleep(1000);
    if (app.exitCode !== null) {
      break;
    }
    status = await fetch(`http://127.0.0.1:${port}/`).then((res) => res.status, () => 0);
  }
} finally {
  app.kill();
  await Promise.all([ '', '-wal', '-shm' ].map((suffix) => rm(db + suffix, { force: true })));
}
if (status !== 200) {
  console.error(output.slice(-4000));
  console.error(`smoke: GET / returned ${status || 'no response'}`);
  process.exit(1);
}
console.log(`smoke: GET / returned 200 on port ${port}`);
