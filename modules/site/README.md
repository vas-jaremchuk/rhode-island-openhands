# `site`

Command line tasks that build the demo content. Run them from the project root:

| Task | Does |
|------|------|
| `node app site:seed` | Creates the admin (`admin` / `$APOS_ADMIN_PASSWORD`, default `admin`), imports `fixtures/images/` into the media library, fills the Global settings the layout reads, adds the three News & Events items, the three Community Posts and the five College Partners, and makes sure the home page is published. Idempotent: it finds the admin by username, each image by slug, each piece by the slug in `seed/news.js` / `seed/community.js` / `seed/partners.js`, and only writes Global fields that are empty, so a second run creates nothing. |
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
| `seedGlobal(req)` | Fills the empty Global fields from `seed/global.js`: header wordmarks, utility links, site title, meta description and Open Graph image. |
| `seedNews(req)` | Inserts the News & Events items of `seed/news.js` that are missing, keyed by their explicit slug. |
| `seedCommunity(req)` | Inserts the Community Posts of `seed/community.js` that are missing, keyed by their explicit slug, relating each to its image in the media library. |
| `seedPartners(req)` | Inserts the College Partners of `seed/partners.js` that are missing, keyed by their explicit slug, relating each to its logo in the media library. |
| `findImageByTitle(req, title)` | Returns the media-library piece the seed imported for `title`, or `null`. |
| `importImage(req, file, { title, alt })` | Uploads `file` (relative to the project root) and inserts the image piece. The slug is `image-<slugified title>` and is the idempotency key. |
| `ensureHomePage(req)` | Returns the published home page, publishing or parking it when it is missing. |

Seed content lives in data files, one per area of the site, so a later task adds an entry
instead of a code path. `seed/images.js` holds the media library; `seed/global.js` holds the
Global settings for the header, SEO and community avatar; `seed/news.js` holds the News &
Events pieces; `seed/community.js` holds the Community Posts; `seed/partners.js` holds the
College Partners.

## Fields

None. This module registers no fields.
