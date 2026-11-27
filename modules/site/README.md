# `site`

Command line tasks that build the demo content. Run them from the project root:

| Task | Does |
|------|------|
| `node app site:seed` | Creates the admin (`admin` / `$APOS_ADMIN_PASSWORD`, default `admin`), imports `fixtures/images/` into the media library and makes sure the home page is published. Idempotent: it finds the admin by username and each image by slug, so a second run creates nothing. |
| `node app site:reset` | Refuses to run when `NODE_ENV=production`. Deletes the SQLite file named by `APOS_DB_URI` (plus its `-wal` / `-shm`) and `public/uploads/*`, then runs the seed in a child process. |

`npm run setup` runs the migrations and then `site:seed`; `npm run reset` runs `site:reset`.

## Methods

`apos.modules.site` exposes the steps so later tasks and tests reuse them instead of
duplicating queries:

| Method | Does |
|--------|------|
| `seed()` | The whole seed, with a published-mode request. |
| `ensureAdmin(req)` | Creates the `admin` user if the username is free. |
| `seedImages(req)` | Imports every entry of `seed/images.js`. |
| `importImage(req, file, { title, alt })` | Uploads `file` (relative to the project root) and inserts the image piece. The slug is `image-<slugified title>` and is the idempotency key. |
| `ensureHomePage(req)` | Returns the published home page, publishing or parking it when it is missing. |

Seed content lives in data files, one per area of the site, so a later task adds an entry
instead of a code path. `seed/images.js` holds the media library.

## Fields

None. This module registers no fields.
