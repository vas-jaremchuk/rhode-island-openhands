# 05. Sandbox, tests and definition of done

## Sandbox goals

1. A fresh clone runs with **no external services**: `npm ci && npm run setup && npm run dev` → site on `http://localhost:3000`, admin `admin` / `admin`.
2. The database is one SQLite file (`data/site.db`); resetting is deleting it.
3. Every task can be verified headlessly (Dark Factory sandboxes have no Docker, no MongoDB, Chromium available).

## npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `setup` | `node app @apostrophecms/migration:migrate && node app site:seed` | First run / after reset |
| `dev` | `nodemon` (from the starter; Vite HMR for Sass/JS) | Watch mode |
| `build` | `cross-env NODE_ENV=production node app @apostrophecms/asset:build` (from the starter) | Production assets |
| `start` | `NODE_ENV=production node app` | Run |
| `reset` | `node app site:reset` | Wipe DB + uploads, seed again |
| `db:snapshot` | `apos-db-dump sqlite://data/site.db > fixtures/snapshots/<date>.jsonl` | Share a content state |
| `db:restore` | `apos-db-restore sqlite://data/site.db < <file>` | Load a snapshot |
| `lint` | `eslint . && stylelint "modules/**/*.scss" && node scripts/check-tokens.mjs` | Static checks |
| `test` | `mocha test/server` | Server tests (fresh SQLite file per run) |
| `test:e2e` | `playwright test test/e2e` | Browser + axe |
| `test:visual` | `playwright test test/visual` | Screenshot comparison 1440 / 375 |
| `ci` | `lint && test && build && test:e2e && test:visual` | Single required check |

`.env.example` holds the defaults from 01; `dotenv` is loaded in `app.js` only outside production.

## Test plan

### Server (mocha)

Boot Apostrophe once per file with `APOS_DB_URI=sqlite://data/test-<pid>.db`, `shortName: 'organo-ri-test'`; delete the file in `after()`.

| Area | Cases |
|------|-------|
| Boot | All modules load; schema validation passes (`apos.schema.validateAllSchemas`) |
| Seed | `site:seed` twice → no duplicates; home page has 8 widgets in the right order |
| Pieces | Required fields enforced; `news-item` sort by date; `community-post` relative date formatter (`6d`, `3w`, `Mar 4`) |
| Widgets | `news-feed-widget` `latest` returns newest 3 published only; `manual` keeps editor order |
| Contact | Valid → 200 + submission stored + email transport called; missing field → 400 with field errors; invalid area → 400; honeypot → 200 and nothing stored; 6th submission in 10 min → 429; form-encoded → 303 |
| Permissions | Anonymous `GET /api/v1/contact-submission` → 401/403; editor can list |
| SQLite | Full-text search query on `news-item` works (FTS5) — guards adapter regressions |

### End-to-end (Playwright + axe)

Against `npm start` with a seeded DB, at 1440 × 900 and 375 × 812:

- Page renders all 10 regions, headings order (h1 → h2s) correct.
- Video: no request to youtube/vimeo before click; click → iframe with autoplay.
- Carousels: next/prev change slide, progress bar width changes, buttons disabled at ends, keyboard operable.
- Contact: JS path success + error states; no-JS path (`javaScriptEnabled: false`) redirects with `?sent=1`.
- `axe` zero serious/critical at both widths.
- Logged-in editor: can open the page in edit mode, add a `news-feed-widget`, publish; anonymous view shows it.

### Visual (Playwright screenshots)

- Baselines: Figma exports of each section at 1440 and 375 (T0.2 stores them in `reference/screens/<section>@<width>.png`).
- Test screenshots each `<section>` and compares with `toHaveScreenshot({ maxDiffPixelRatio: 0.03 })` against the code's own approved baseline; a separate report (`npm run visual:figma`) overlays Figma vs page for human review (not a hard gate, because fonts render differently).

## Definition of done (every task)

1. `npm run ci` passes locally / in the sandbox.
2. New fields and widgets appear in the editor with labels and help text.
3. Seed updated when a widget or piece changes, so `npm run reset` shows the feature.
4. Section matches Figma at 1440 and 375 (visual check + review screenshot attached to the PR).
5. No console errors; axe clean for the touched section.
6. Docs: module README (fields table) updated.

## CI

GitHub Actions, `ubuntu-latest`, Node 22, one job named **`ci`** (matching the other Factory projects):

```yaml
- uses: actions/setup-node@v4
  with: { node-version: 22, cache: npm }
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npm run ci
  env: { APOS_DB_URI: 'sqlite://data/ci.db', APOS_ADMIN_PASSWORD: admin }
- uses: actions/upload-artifact@v4   # playwright report + visual diffs on failure
```

`better-sqlite3` ships prebuilt binaries for Node 22 on linux-x64 and darwin-arm64; no compiler needed in CI or the sandbox.
