# Organogenesis Rhode Island (rhode-island-openhands)

One-page site for Organogenesis' Rhode Island facility, built on ApostropheCMS 4 with SQLite
(no database server). Built task by task by OpenHands (GitHub issues labelled `openhands`) from the
specification in `reference/spec/`.

## Run locally

Requires Node.js 22.12+ (24 LTS recommended) and npm.

```sh
npm ci
npm run setup     # migrations + seed (admin admin/admin, images, home page; dev only)
npm run dev       # http://localhost:3000, log in at /login
npm run reset     # delete the database and uploads, then seed again (dev only)
```

The database is `data/site.db` (override with `APOS_DB_URI`, see `.env.example`).

## Checks

`npm run ci` runs lint, tests, the production build and browser tests. It is the GitHub
Actions job `ci`.

## Where things are

- `AGENTS.md`: conventions for people and agents (binding).
- `reference/spec/`: specification; `reference/spec/02-design-system.md` is the design catalogue.
- `reference/screens/`: Figma renders per section at 1440 and 375 px.
- `fixtures/images/`: Figma exports used by the seed (`INVENTORY.md` lists them).
- `.openhands/setup.sh`: prepares the OpenHands sandbox (install, database, Chromium).
- `.agents/skills/`: ApostropheCMS skills for the coding agent (loaded by OpenHands).

Based on the ApostropheCMS Essentials starter kit (MIT, Apostrophe Technologies).
