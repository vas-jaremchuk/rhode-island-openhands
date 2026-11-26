# 01. Architecture

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js 22 LTS (≥ 22.12) | Required by `apostrophe@4.34`. |
| CMS | `apostrophe` 4.34.x | Pin the minor in `package.json` (`~4.34.1`). |
| Database | SQLite via `@apostrophecms/db-connect` (bundled with core) | `APOS_DB_URI=sqlite://data/site.db`. Sessions also go to the DB (the default `connect-mongo` store is replaced, see below). |
| Media | `uploadfs` local driver → `public/uploads` | S3 later via `APOS_S3_*` env, no code change. |
| Templates | Server-side JSX (`.jsx`), as in the official starter kit | Rendered by Apostrophe core: no React, no client runtime. Nunjucks stays available; a `.html` template must not include a `.jsx` one |
| Styles | Sass (`ui/src/*.scss` per module) | Built by `@apostrophecms/vite` (the starter's asset build; HMR in dev, `npm run build` for production) |
| Client JS | Vanilla ES modules, widget players (`apos.util.widgetPlayers`) | No jQuery, no carousel library (see 04, "Carousel"). |
| Fonts | Self-hosted WOFF2 in `modules/asset/ui/public/fonts` | Roboto, Roboto Condensed, Libre Franklin (all OFL, via `@fontsource/*`, copied at build). Icons: Font Awesome Free 7 (CC BY 4.0) + Feather arrow-right (MIT) as an inline SVG sprite. |
| Tests | Mocha (server), Playwright + axe-core (browser), Playwright screenshots (visual) | See 05. |
| Lint | ESLint (`eslint-config-apostrophe`), Stylelint (`@apostrophecms/stylelint-no-mixed-decls` + standard-scss) | |
| Package manager | npm (lockfile committed; the starter's `.gitignore` ignores `package-lock.json`, remove that line) | Apostrophe projects are npm projects; pnpm skips the native builds of `better-sqlite3` and `sharp`. Keep the starter's `allowScripts` block |
| Modules | ES modules (`"type": "module"`, `export default {}`) | As in the starter kit |

### Sessions on SQLite

Apostrophe's `@apostrophecms/express` module passes its own database client to `connect-mongo`; with `sqlite://` that client is db-connect's, so sessions are stored in SQLite with no extra configuration (the official installer defaults to SQLite). T1.1 keeps a smoke test: log in, restart, still logged in.

## Repository layout

Start from `apostrophecms/starter-kit-essentials` (ESM, JSX templates, Vite, its own `AGENTS.md`), for example `npm create apostrophe@latest -- --unattended --kit=apostrophe-essentials --db=sqlite --project-name=rhode-island-factory --password=admin --telemetry=off`, then:

```
rhode-island-factory/             # repo root
├── app.js                        # module list, shortName 'organo-ri'
├── package.json
├── .env.example                  # APOS_DB_URI, APOS_RELEASE_ID, SMTP_*, CONTACT_TO, …
├── data/                         # SQLite file(s) – git-ignored
├── public/uploads/               # media – git-ignored
├── fixtures/                     # seed JSON + images used by `site:seed`
├── reference/                    # Figma reference (screenshots, tokens, node map) – read-only for devs
├── lib/                          # shared helpers (e.g. schema field presets)
├── modules/
│   ├── @apostrophecms/
│   │   ├── express/              # session store, security headers
│   │   ├── global/               # header, SEO, contact settings
│   │   ├── home-page/            # home template, single area
│   │   ├── page/                 # page types, park home
│   │   ├── i18n/                 # en only
│   │   └── image-widget/         # tweaks
│   ├── asset/                    # global Sass (tokens, base, utilities), fonts, shared JS
│   ├── news-item/                # piece types (singular names)
│   ├── community-post/
│   ├── college-partner/
│   ├── contact-submission/
│   ├── hero-widget/              # section widgets
│   ├── feature-section-widget/   # Facility + Education ("centered intro + video + extras")
│   ├── impact-widget/
│   ├── community-feed-widget/
│   ├── news-feed-widget/
│   ├── careers-widget/
│   ├── about-widget/
│   ├── contact-widget/
│   ├── contact-form/             # POST route, validation, email, rate limit
│   └── site/                     # CLI tasks: seed, reset
├── scripts/                      # check-tokens, figma-reference helpers
└── test/
    ├── server/                   # mocha
    ├── e2e/                      # playwright + axe
    └── visual/                   # playwright screenshot baselines (1440, 375)
```

Module naming: widgets end in `-widget`, pieces are singular. Modules stay flat, `modules/<name>/`, as in the starter kit (no `nestedModuleSubdirs`).

## Environments

| Env | DB | Media | How |
|-----|----|-------|-----|
| Local / sandbox | `sqlite://data/site.db` | `public/uploads` | `npm run dev` (watch) or `npm start` |
| Test | `sqlite://data/test-<run>.db`, deleted after the run | tmp dir | `npm test` |
| Staging/production | Decide later (QUESTIONS Q-8). SQLite on a persistent volume is fine for one instance; for more than one instance use Postgres or MongoDB (`apos-db-dump \| apos-db-restore`) | S3 or persistent disk | Docker image + `APOS_RELEASE_ID` |

## Configuration (env)

| Variable | Purpose | Default (dev) |
|----------|---------|---------------|
| `APOS_DB_URI` | Database | `sqlite://data/site.db` |
| `APOS_RELEASE_ID` | Asset cache-busting in prod | git SHA |
| `APOS_BASE_URL` | Absolute URLs (canonical, OG) | `http://localhost:3000` |
| `PORT` | HTTP port | `3000` |
| `SESSION_SECRET` | Express session secret | random in `.env` |
| `SMTP_URL` | Nodemailer transport for contact emails | unset → log to console |
| `CONTACT_TO` | Fallback recipient when Global `contactRecipients` is empty | `vasj@sparkdsg.com` |
| `APOS_ADMIN_PASSWORD` | Used by `site:seed` to create the admin | `admin` in dev only |

## Request flow

1. `GET /` → `home-page` template → renders `main` area → each section widget renders its `widget.jsx`.
2. Feed widgets (`news-feed-widget`, `community-feed-widget`, the partner logos in `feature-section-widget`) load their pieces in the widget's `load` step (server-side, no client fetch), so the page is complete HTML and cacheable.
3. `POST /api/v1/contact-form/submit` → validate → insert `contact-submission` → send email → JSON `{ ok: true }`; the form also works without JS (HTML POST + redirect with `?sent=1`).

## Caching and SEO

- Page cache: `@apostrophecms/page` `cache: { page: { maxAge: 300 } }` for anonymous users.
- Meta: title, description, OG image from Global settings; `<link rel="canonical">`.
- `robots.txt`: allow all in prod, disallow in sandbox (`APOS_ROBOTS=disallow`).
- Optional later: `@apostrophecms/seo` and `@apostrophecms/sitemap` once there is more than one page.
