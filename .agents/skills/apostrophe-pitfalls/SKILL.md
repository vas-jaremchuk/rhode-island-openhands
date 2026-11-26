---
name: apostrophe-pitfalls
description: Prevent common ApostropheCMS 4, SQLite and npm defects when planning, implementing and reviewing.
---

- **npm only.** Apostrophe projects are npm projects (`packageManager: npm@…`). pnpm and yarn skip or break the native builds of `better-sqlite3` and `sharp`, and the site no longer starts. Use `npm ci` with a committed `package-lock.json`; the starter kit's `.gitignore` ignores the lockfile, so remove that line.
- Keep the `allowScripts` block in `package.json` (`better-sqlite3`, `sharp`, `esbuild`, `@parcel/watcher` …). Without it newer npm versions skip their install scripts.
- **SQLite supports a subset of the MongoDB API** (`@apostrophecms/db-connect`). Custom queries may use `$eq $ne $gt $gte $lt $lte $in $nin $and $or $not $exists $regex $text $all $size`, updates `$set $unset $inc $push $pull $addToSet $currentDate` (no `$each`), and aggregation `$match $group $project $unwind $sort $limit $skip`. No `$elemMatch`, `$where`, `$expr`, `$lookup`, `$each`, transactions or `sqlite://:memory:`.
- `updateMany`, `findOneAndUpdate`, `replaceOne`, `$rename`, `upsert` and `$push`/`$pull` with object values are read-modify-write on SQLite, not atomic. Don't build counters or locks on them.
- Prefer Apostrophe's query builders (`find(req, …)`) over raw collections; they are what the adapter is tested against.
- Never commit `data/`, `public/uploads/`, `apos-build/`, `public/apos-frontend/` or `.env`.
- **Tests on SQLite:** boot Apostrophe with `APOS_DB_URI=sqlite://data/test-<unique>.db` (a file, never `:memory:`), a test `shortName`, and delete the file afterwards (`-wal` and `-shm` too). One Apostrophe instance per test file; don't run test files that share a database in parallel. Apostrophe's own suite runs one adapter at a time for the same reason.
- `localized: false` turns off draft/published for a type and forces `autopublish` off; use it for data that is not editorial content (form submissions, logs).
- Drafts: content saved in the editor is a draft until published. Anonymous requests see only published docs. Seeds and tests that check the public page must publish.
- `req` matters: queries with `self.apos.task.getAnonReq()` return only what visitors may see. Elevating with `getReq()` in a route that serves visitors leaks drafts and private data.
- Relationship values are arrays and are joined at query time; storing `_image` by hand in a seed needs the related `_id`s (`imageIds`/`imageFields` are written by Apostrophe when you save through the module).
- A widget type in area data is the module name without `-widget`; a mismatch renders nothing and logs a warning.
- Widget players run again after every edit: guard against binding listeners twice; clean up timers.
- CSRF: every non-GET request must carry the `<shortName>.csrf` cookie, which any GET sets. Same-origin `fetch` and same-origin HTML form posts pass; a test or script that POSTs (supertest, curl, Playwright `request`) must GET a page first or send that cookie, otherwise it gets 403. API-key and bearer requests skip the check. Don't add `csrfExceptions` to make a test pass.
- After changing `app.js`, a module's `options`, or adding a module, restart the app; `npm run dev` restarts on server files but not always on new folders.
- Asset build: `NODE_ENV=production node app @apostrophecms/asset:build` must pass in `verify`; a Sass or import error appears only there, not in server tests.
- Playwright: the stack has no downloaded browsers. `playwright.config` must launch the system Chromium: `launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }` (set by the stack; undefined on a developer machine, where Playwright uses its own).
- `.factory/commands.json` `app.readyPath` should be a page that needs the database (for example `/`), so `stack up` waits for migrations and the first asset build.
- Copy, images and links come from `reference/` and the seed; never fetch the live site at runtime or in tests.
