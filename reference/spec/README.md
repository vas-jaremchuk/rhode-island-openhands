# Organogenesis Rhode Island: one-page site on ApostropheCMS

> Copy of the specification for agents. The plan (`06-plan.md`, `07-dark-factory.md`, `plan/`) is not copied: work arrives as GitHub issues labelled `openhands`, each self-contained.

Development specification and plan, 2026-11-24.

## Source design

- Figma file: `SVn1hZEKjBfErrEuv2A3ou` (ORG001 Rhode Island Design Updates).
- Section to build: **Rhode Island Updates**, node `2161:3` (the initial, unmodified design).
- In scope: **Home page** only.
  - Desktop: `1440 Home`, node `2279:53` (1440 × 9129).
  - Mobile: `375 Home`, node `2161:235` (375 × 7909).
- Out of scope: `375 Home – Alt Option` (`2292:157`), `1440 Community` (`2161:445`), `375 Community` (`2161:580`). Their components overlap heavily with Home, so a Community page can be added later from the same widgets (see 06-plan.md, "Later").

## Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | ApostropheCMS **4.34.x**, Node **22.12+** (22 LTS) | Current release; SQLite support landed in 4.31.0. |
| D2 | Database: **SQLite** through Apostrophe's own `@apostrophecms/db-connect` (`APOS_DB_URI=sqlite://data/site.db`) | Officially supported adapter (better-sqlite3). No MongoDB server in the sandbox; one file per environment; `apos-db-dump` / `apos-db-restore` move data to MongoDB or Postgres later without code changes. |
| D3 | Native Apostrophe front end as in the official starter kit: server-side JSX templates (rendered by Apostrophe core, no React), Sass, vanilla JS widget players, `@apostrophecms/vite` build | No extra framework (no Astro, no React). In-context editing works out of the box. |
| D4 | The page is a single `home-page` with **one area of section widgets**, one widget per Figma section | Editors can reorder, hide or duplicate sections; each widget maps 1:1 to a Figma frame, which keeps tasks small and testable. |
| D5 | Dynamic content is **in the CMS**: piece types `news-item`, `community-post`, `college-partner`, `contact-submission` | Agreed with Vasyl. LinkedIn posts are entered by hand with a link to the original post. |
| D6 | Videos: **YouTube/Vimeo URL** (core `oembed` field) + custom poster image + Figma play button; plays inline in place of the poster | Agreed with Vasyl. Nothing is hosted by the CMS. |
| D7 | Contact form: own module (`contact-form`), saves to `contact-submission` and emails a configurable address; honeypot + rate limit | Three fields only; full control over markup; no dependency on how the Form extension behaves on SQLite. |
| D8 | Two executors from one plan: **human developers** read `01`–`06`; **Dark Factory** gets an `apostrophe` stack and the same tasks as Deliveries (`07`, `plan/tasks.json`) | Agreed with Vasyl. |
| D9 | Free substitutes: **Libre Franklin** for BentonSans, **Font Awesome Free 7** for FA Pro; footer stays the **flattened Figma shape**, which is a plain navy block; mobile header is **logo only** | Answers of 2026-11-24 (QUESTIONS Q-1, Q-2, Q-5, Q-6) |
| D10 | Seed defaults: all buttons/links → `https://www.organogenesis.com/`; all videos → `https://www.youtube.com/watch?v=YqP8s2M4xig`; areas Option A/B/C; recipient `vasj@sparkdsg.com`; all editable in the admin | Answers of 2026-11-24 (Q-10 – Q-12) |

## Documents

| File | Contents |
|------|----------|
| [01-architecture.md](01-architecture.md) | Stack, repository layout, environments, configuration |
| [02-design-system.md](02-design-system.md) | Tokens, type scale, breakpoints, components, Figma node map |
| [03-backend.md](03-backend.md) | Apostrophe modules: page type, pieces, widgets, global settings, contact API, seed |
| [04-frontend.md](04-frontend.md) | Templates, Sass architecture, JS players, responsive rules, accessibility, performance |
| [05-sandbox-and-qa.md](05-sandbox-and-qa.md) | SQLite sandbox, scripts, fixtures, tests, CI, definition of done |
| [06-plan.md](06-plan.md) | Phases, tasks with acceptance criteria, estimates, dependencies |
| [07-dark-factory.md](07-dark-factory.md) | `apostrophe` capability for Dark Factory and how tasks become Deliveries |
| [QUESTIONS.md](QUESTIONS.md) | Open questions with proposed defaults |
| [plan/tasks.json](plan/tasks.json) | Machine-readable task list (source for Factory Deliveries and tickets) |

## Status of the design read

Complete for the Home page. All section styles were read through the Figma MCP (2026-11-24; the second half with `spark_dev_access@sparkdsg.com`). Assets and section renders were exported into the project repository: `fixtures/images/` (with `INVENTORY.md`) and `reference/screens/<section>@1440.png` / `@375.png`.
