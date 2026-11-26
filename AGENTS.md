# AGENTS.md — rhode-island-openhands

Machine-readable project brief for AI coding assistants. Facts and conventions only. For anything
not covered here — API details, options, edge cases — consult the docs:
https://apostrophecms.com/docs/

---

## Architecture

ApostropheCMS 4 project using ES modules (`"type": "module"`). Modules live in `modules/`,
shared field config in `lib/`, **JSX templates** in `views/` and `modules/*/views/`. Asset
pipeline uses `@apostrophecms/vite`; client-side source is in `modules/asset/ui/src/`.

This project is **fully converted from Nunjucks to JSX**. Write new templates as `.jsx`. Nunjucks
remains fully supported by Apostrophe core and the two interoperate — see
[JSX/Nunjucks Interop](#jsxnunjucks-interop) for the one hard rule.

JSX here is **server-side rendering only** — no React, no virtual DOM, no client runtime. It's an
alternate template syntax evaluated where Nunjucks would have run, implemented by Apostrophe core
itself (`apostrophe/modules/@apostrophecms/template/lib/jsx*.js`). No `react`/`react-dom` package.

## Dev Commands

```
npm run dev      # start with nodemon (watches modules/, lib/, views/, incl. .jsx)
npm start        # start without watch
npm run build    # production asset build
npm run serve    # production server
```

## Anatomy of a JSX Template

Default-export a function taking `(data, helpers)`:

```jsx
export default function ({ page }, { Area }) {
  return (
    <>
      <h1>{page.title}</h1>
      <Area doc={page} name="main" />
    </>
  );
}
```

- **`data`** — same object as `data.*` in Nunjucks. Destructure it; write `page.title`, not
  `data.page.title`.
- **`helpers`** — `{ apos, helpers, Area, Component, Extend, Template, Widget, __t }` (below).
- May be `async` if the template itself needs to fetch something first; Apostrophe awaits all
  output regardless, so async children don't require it.

## The Second Argument

| Name | Purpose |
|------|---------|
| `apos` | The real `self.apos`. Call any module method directly. **Prefer this.** |
| `helpers` | Nunjucks-oriented helper wrappers — use only when you need a Nunjucks helper's exact behavior. |
| `Area` | Renders an area. Replaces `{% area %}` |
| `Component` | Invokes an async component. Replaces `{% component %}` |
| `Template` | Renders another template, **include semantics** (props arrive as data). Replaces `{% include %}` |
| `Extend` | Renders another template, **extends semantics** — props become `{% block %}` overrides against a `.html` target. Replaces `{% extends %}` |
| `__t` | Localization helper — same `req.t` as Nunjucks's `__t` global. Not on `data` or `helpers`. |

`Widget` also exists, for the rare case of reimplementing `area.html` itself — see the
[JSX templates guide](https://apostrophecms.com/docs/guide/jsx-templates.html) rather than reaching for it from this brief.

## Nunjucks → JSX Gotchas

Full Nunjucks-to-JSX mapping in the
[JSX templates guide](https://apostrophecms.com/docs/guide/jsx-templates.html). Things that
guide won't warn you about:

- No `key`/`ref` — there's no client reconciler. Don't add them, even inside `.map()`.
- `style` accepts a **plain string**, unlike React (`` style={`background-image: url(${url})`} ``).
- Templates are real JS modules — `import` helpers, define extra components in the same file.
- Only the default export receives `helpers`. Inline/imported components are plain functions —
  pass `apos`, `Area`, `__t` etc. in as explicit props, under their own names (`__t={__t}`).

## Adding a Widget

Standard Apostrophe widget setup — see the
[custom widgets guide](https://apostrophecms.com/docs/guide/custom-widgets.html). The one
difference here: write the template as `.jsx`.

```jsx
// modules/card-widget/views/widget.jsx
export default function ({ widget }, { Area }) {
  return (
    <div className="widget card-widget">
      <Area doc={widget} name="contentRT" />
    </div>
  );
}
```

## Adding a Page Type

Standard Apostrophe page type setup — see the
[pages and page types guide](https://apostrophecms.com/docs/guide/pages.html). Two differences
here: write the template as `.jsx`, and it extends the site layout by passing named slots as
props instead of using `{% block %}`:

```jsx
// modules/default-page/views/page.jsx
export default function ({ page }, { Extend, Area }) {
  return (
    <Extend templateName="layout.jsx" main={<Area doc={page} name="main" />} />
  );
}
```

## Template Discovery

Apostrophe discovers templates by filename — no registry required.

| Template type | Path convention |
|---------------|-----------------|
| Widget | `modules/<widget-name>/views/widget.jsx` |
| Page | `modules/<page-type>/views/page.jsx` |
| Piece index | `modules/<piece-page>/views/index.jsx` |
| Piece show | `modules/<piece-page>/views/show.jsx` |

Lookup tries `.jsx`, `.njk`, then `.html` per directory, nearest module directory first — a
project-level `page.jsx` beats a core-level `page.html`. A `.jsx`/`.njk`/`.html` suffix in a
`templateName` is a starting point, not a constraint: all three extensions are still tried.

## JSX/Nunjucks Interop

> **A `.html` template cannot `{% extends %}`/`{% include %}`/`{% import %}` a `.jsx` template.**
> The reverse (JSX consuming Nunjucks, incl. `<Extend>` block overrides) is fully supported.

This includes `.html` templates inside `node_modules`: core's `@apostrophecms/page/views/notFound.html`
extends `layout.html`, so a JSX layout breaks every 404 page unless shadowed — which is why
`modules/@apostrophecms/page/views/notFound.jsx` exists. Don't delete it.

This project has no other `.html` overrides; core's `@apostrophecms/template/views/outerLayout.html`
is used as-is, and `views/layout.jsx` extends it directly via
`<Extend templateName={data.outerLayout} … />`.

## Template Inheritance

```
outerLayoutBase.html  ← ApostropheCMS core (never edit)
  outerLayout.html    ← core default; override in modules/@apostrophecms/template/views/ only for <head>/meta changes
    views/layout.jsx  ← edit for site chrome (header, nav, footer)
      modules/<page-type>/views/page.jsx ← edit for page content
```

No named blocks in JSX — markup the parent renders is passed as props, plus the implicit
`children` prop for anything between the opening/closing tags.

## Data Sources in Templates

Available on the first function argument. Destructure what you need.

| Variable | Contents | Notes |
|----------|----------|-------|
| `widget` | Widget document | Widget templates only |
| `page` | Current page document | All page templates |
| `piece` | Current piece document | Piece-type page templates only |
| `global` | Global settings document | Requires `@apostrophecms/global` |
| `user` | Authenticated user or `null` | All templates |
| `home` | Home page document | All templates |
| `query` | Query string as object | All templates |
| `outerLayout` | Resolves the correct outer layout | Handles full-page vs AJAX |
| `contextOptions` | Context options passed by the enclosing area | Widget templates |
| `children` | Markup passed between a caller's tags | Templates used as layouts |

## `_` Prefix Convention

Relationship fields are prefixed with `_` (e.g., `_linkPage`, `_author`).
- Value is always an **array**, even with `max: 1`
- Not stored in the document — joined at query time
- Access single results via `doc._field[0]`

## Shared Field Utilities (`lib/`)

| File | Exports | Use for |
|------|---------|---------|
| `lib/area.js` | Default widget config object | Area field `widgets` option |

```js
import areaConfig from '../../lib/area.js';
// then: options: { widgets: areaConfig }
```

## i18n Key Convention

All project translation strings use the `project:` namespace.

- Key format: `'project:camelCaseKey'` (e.g., `'project:linkText'`)
- Translation files: `modules/@apostrophecms/i18n/i18n/project/<locale>.json`
- Register namespace: `modules/@apostrophecms/i18n/index.js` → `i18n: { project: { browser: true } }`

## Team Conventions

### This project

Organogenesis Rhode Island: a **one-page site** (the Home page only) built from the Figma file
`SVn1hZEKjBfErrEuv2A3ou`, section `2161:3`, frames `1440 Home` (`2279:53`) and `375 Home`
(`2161:235`). Agents never open Figma; everything needed is in `reference/`:

| Path | Contents |
|------|----------|
| `reference/spec/README.md` | Decisions D1–D10 |
| `reference/spec/02-design-system.md` | **Design catalogue**: tokens, type styles, layout, components, Figma node map. Source of every visual value |
| `reference/spec/03-backend.md` | Module, field and API specification (piece types, widgets, Global, contact form, seed) |
| `reference/spec/04-frontend.md` | Templates, styles, players, accessibility, performance |
| `reference/spec/05-sandbox-and-qa.md` | Scripts, tests, definition of done |
| `reference/spec/QUESTIONS.md` | Answered questions and defaults. **Binding**; cite `Q-n` in a comment where code relies on one |
| `reference/screens/<section>@1440.png`, `@375.png` | Figma renders per section (visual target) |
| `fixtures/images/` | Photos, logos and icons exported from Figma (seed and templates use these) |

### Rules

- Work arrives as GitHub issues labelled `openhands`, one Task each. The issue body is the Task spec;
  its acceptance criteria are the definition of done. Read the skills in `.agents/skills/`
  (`apostrophe-modules`, `apostrophe-templates`, `apostrophe-pitfalls`) before changing code.
- One issue, one branch (`openhands/issue-<n>`), one pull request against `main` that says
  `Closes #<n>`, lists what changed and what you ran. Do not start another issue in the same PR.

- Database: SQLite through `APOS_DB_URI` (default `sqlite://data/site.db`, set in `app.js`). Never
  commit `data/`. Custom queries use only the operators db-connect supports (see the skill
  `.agents/skills/apostrophe-pitfalls`).
- npm only, `npm ci` with the committed `package-lock.json`. Keep the `allowScripts` block.
- Modules are flat: `modules/<name>/`. Widgets end in `-widget`; piece types are singular.
  Shared field presets live in `lib/fields.js`; area widget sets in `lib/area.js`.
- Templates are JSX. Section widgets render one `<section>` each; one `<h1>` on the page (hero).
- Styles: tokens only. Raw hex colours and px font sizes belong in
  `modules/asset/ui/src/scss/_tokens.scss` and nowhere else.
- Copy comes from `reference/spec/02-design-system.md` (node map) and the seed. Every button and
  READ MORE link defaults to `https://www.organogenesis.com/`; every video defaults to
  `https://www.youtube.com/watch?v=YqP8s2M4xig` (Q-11, Q-12). All of it stays editable.
- Seed (`node app site:seed`, from Task T1.2 on) is idempotent and is updated in the same change
  that adds or changes a field, so `npm run setup` always shows every feature.
- Designed widths: 1440 and 375. Also check 768 and 1024 for overflow.
- Starter leftovers (`default-page`, `nested-layout-widget`, `nested-column-widget`, `bp-*` styles,
  the welcome content) may be removed by the Task that replaces them.

### Commands

| Purpose | Command |
|---------|---------|
| First run (migrations + admin `admin`/`admin`) | `npm ci && npm run setup` (or `bash .openhands/setup.sh`, which also installs Chromium) |
| Develop | `npm run dev` (http://localhost:3000, log in at `/login`) |
| All checks (same as CI job `ci`; run before opening a PR) | `npm run ci` |

### Do not change without the Task saying so

`.openhands/`, `.github/`, `.agents/skills/`, `reference/`, `eslint.config.js`, the `ci` script chain in `package.json`.
