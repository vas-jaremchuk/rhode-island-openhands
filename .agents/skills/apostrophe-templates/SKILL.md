---
name: apostrophe-templates
description: Render ApostropheCMS 4 pages and widgets with server-side JSX or Nunjucks templates, module styles and widget players built by Vite or webpack, and check them in the browser.
---

Read the repository's `AGENTS.md` first; it says which template syntax and asset build the project uses.

**Templates**

- Apostrophe discovers templates by file name: `modules/<widget>/views/widget.(jsx|html)`, `modules/<page-type>/views/page.(jsx|html)`, `views/layout.(jsx|html)`. Lookup tries `.jsx`, `.njk`, then `.html`, nearest module first.
- JSX here is server-side only (no React, no `key`/`ref`, `style` is a plain string). A template default-exports `function (data, { apos, Area, Extend, Template, Component, __t })`. Destructure `data`: `{ page }`, `{ widget }`, `{ global }`, `{ user }`.
- Render areas with `<Area doc={page} name="main" />` (JSX) or `{% area data.page, 'main' %}` (Nunjucks). Page templates pass content to the layout: `<Extend templateName="layout.jsx" main={…} />`.
- **A `.html` template cannot extend, include or import a `.jsx` template.** Core's `notFound.html` extends `layout.html`; a JSX project shadows it with `modules/@apostrophecms/page/views/notFound.jsx`. Don't delete it.
- Never hard-code copy that an editor should change: it comes from fields, `global` or i18n (`__t('project:key')`, files in `modules/@apostrophecms/i18n/i18n/project/<locale>.json`).
- A relationship is an array: `widget._image?.[0]`. Image URLs: `apos.attachment.url(image.attachment, { size: 'one-half' })`; responsive: `apos.image.srcset(image.attachment)`, plus `width`/`height` to prevent layout shift. Decorative images get `alt=""`.
- Templates must render sensibly with empty fields: editors add a widget before filling it.
- One `h1` per page; section titles are `h2`.

**Styles and client code**

- Each module may have `ui/src/index.scss` and `ui/src/index.js`; the asset build bundles them for the public site. Global tokens and base styles live in the `asset` module (`modules/asset/ui/src/`).
- Client behaviour is a widget player, which runs on page load and again whenever an editor adds or changes the widget, so it must be idempotent and scoped to its element:
  ```js
  export default () => {
    apos.util.widgetPlayers.carousel = {
      selector: '[data-carousel]',
      player(el) {
        /* bind listeners inside el only */
      },
    };
  };
  ```
- No jQuery, no global DOM-ready handlers for widget behaviour.
- `npm run dev` rebuilds assets on change; `npm run build` makes the production build. Build output (`apos-build/`, `public/apos-frontend/`) is never committed.

**Checking the result**

- Run `factory stack up --json` and use `urls.app`. Screenshot every changed section at each design width (usually 1440 and 375) with the browser capability and compare with the reference the Task cites.
- Edit mode matters: log in (`/login`, the seeded admin) in a `factory browser run` script, open the page and check that `window.apos.login.user` is set, the widget's editing controls appear and there are no `pageErrors`. Apostrophe's own maintainers verify editor UI this way (a headless probe that logs in and evaluates an expression), because fetching HTML cannot show that the admin UI mounted.
- Check the logged-out page too: `window.apos.login.user` is unset and no editing controls render.
