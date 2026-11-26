# 03. Back end (Apostrophe modules)

All schemas below are the target; field names are final unless a task says otherwise. Shared field presets live in `lib/fields.js` so every widget uses the same `sectionHeading`, `cta` and `video` shapes.

## 1. `app.js`

```js
import 'dotenv/config';
import apostrophe from 'apostrophe';

apostrophe({
  root: import.meta,
  shortName: 'organo-ri',
  modules: {
    '@apostrophecms/express': {},          // session store + headers (see 01)
    '@apostrophecms/global': {},
    '@apostrophecms/page': {},
    '@apostrophecms/home-page': {},
    asset: {},
    '@apostrophecms/vite': {},
    // pieces
    'news-item': {}, 'community-post': {}, 'college-partner': {}, 'contact-submission': {},
    // widgets
    'hero-widget': {}, 'feature-section-widget': {}, 'impact-widget': {},
    'community-feed-widget': {}, 'news-feed-widget': {}, 'careers-widget': {},
    'about-widget': {}, 'contact-widget': {},
    // services
    'contact-form': {}, site: {}
  }
});
```

## 2. Shared field presets (`lib/fields.js`)

| Preset | Fields | Notes |
|--------|--------|-------|
| `sectionHeading({ align })` | `eyebrow` string (max 40), `title` string (required, max 80), `headingLevel` select `h2`/`h3` (default `h2`), `align` select `center`/`left` | Rendered by the shared `section-heading` macro |
| `cta()` | `cta` object: `label` string, `url` url, `newTab` boolean, `showArrow` boolean (default true) | Hidden in output when `label` or `url` is empty |
| `video()` | `video` object: `media` **oembed** (`oembedType: 'video'`, required), `_poster` relationship → `@apostrophecms/image` (max 1, required), `title` string (required; used as the iframe `title` and play-button `aria-label`) | Poster shown until click |
| `lead()` | `lead` string, `textarea: true`, max 400 | Plain text; no rich text needed in the design |

## 3. Page type

### `@apostrophecms/home-page`

- Template `views/page.jsx`: `<Extend templateName="layout.jsx" main={<Area doc={page} name="main" />} />`.
- One field `main` (area). Allowed widgets: all eight section widgets, plus core `@apostrophecms/rich-text` (for fallback content).
- Default content created by `site:seed` (see 7).
- `@apostrophecms/page` options: `park` only the home page and archive; `types: [{ name: '@apostrophecms/home-page', label: 'Home' }]` (no other page types yet).

## 4. Global settings (`@apostrophecms/global`)

Groups shown in the admin as tabs.

| Group | Field | Type | Notes |
|-------|-------|------|-------|
| Header | `_headerLogo` | relationship → image (max 1) | Wordmark (SVG upload allowed, see 6) |
| | `utilityLinks` | array of `{ label, url, style: link \| outline }` | OUR STORY, INVESTORS & MEDIA → `https://www.organogenesis.com/`; CONTACT US (`#contact`, outline). Shown from `lg` only; mobile header is logo only (Q-5) |
| SEO | `siteTitle`, `metaDescription`, `_ogImage` | string / textarea / image | |
| Contact | `contactRecipients` | string (comma-separated emails) | Default `vasj@sparkdsg.com` (Q-10); falls back to env `CONTACT_TO`. Not exposed publicly |
| | `areasOfInterest` | array of `{ label, value }` | Default Option A / Option B / Option C (`option-a`, …) (Q-10); validated server-side |
| | `successMessage` | string | Default "Thank you. We will be in touch." |
| Integrations | `gaMeasurementId` | string | Optional; only loaded after consent (**Q-9**) |

## 5. Piece types

### `news-item`

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | required, max 120 |
| `kind` | select `news` / `event` | required; drives the icon (newspaper / calendar-days) |
| `date` | date | required; displayed `MMMM D, YYYY` |
| `excerpt` | string, textarea | required, max 200; clamped to 3 lines on the card |
| `link` | url | required; "READ MORE" target (opens organo.com article) |
| `newTab` | boolean | default false |

Options: `sort: { date: -1 }`, `alias: 'newsItem'`, `quickCreate: true`, `columns`: title, kind, date, last updated. No piece page (one-page site).

### `community-post`

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | required, max 160 |
| `excerpt` | string, textarea | required, max 240 |
| `_image` | relationship → image | required, max 1 |
| `postedAt` | date | required; displayed relative ("6d", "3w", then `MMM D`) computed at render time |
| `source` | select `linkedin` (default), `other` | for the "globe" / network icon |
| `authorName` | string | default "Organogenesis" |
| `_avatar` | relationship → image | optional; falls back to the Global default avatar |
| `url` | url | required; link to the original post |

Options: `sort: { postedAt: -1 }`.

Relative time is computed server-side at render time; with the page cache at 5 min this stays correct enough. If the page is ever statically cached for longer, switch to a tiny client-side formatter (note in 04).

### `college-partner`

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | required (used as logo `alt`) |
| `_logo` | relationship → image | required, max 1 |
| `url` | url | optional; logo becomes a link |

Ordering is controlled by the widget's relationship (editor drags to reorder).

### `contact-submission`

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | auto: `"<name> – <area>"` |
| `fullName` | string | required, max 120 |
| `email` | email | required |
| `areaOfInterest` | string | must match a `value` in Global `areasOfInterest` |
| `status` | select `new` / `handled` | default `new`; editable in the admin |
| `emailSent` | boolean | set by the service |
| `meta` | object `{ ipHash, userAgent, referer }` | read-only; IP is stored only as a salted SHA-256 |

Options: `localized: false` (no draft/published for form data; Apostrophe forces `autopublish` off), `showCreate: false`, `quickCreate: false`, no `publicApiProjection`. Permissions: admin and editor can view and update `status`; contributors and the public cannot read.

Retention: `site:purge-submissions --days=365` task (scheduled outside the app). **Q-7** confirms the period.

## 6. Widget types

All widgets: `extend: '@apostrophecms/widget-type'`, `className: false`, own `views/widget.jsx`, own `ui/src/index.scss` (and `ui/src/index.js` when they have a player). Every section widget also gets:

- `anchor` string (slug, optional) → `id` on the `<section>` (for `#contact`, `#news` links),
- `theme` select where the design has variants (`light` / `surface` / `gradient`).

| Widget | Fields (in addition to `anchor`) | Server `load` | Player |
|--------|----------------------------------|---------------|--------|
| `hero-widget` | `_background` image, `backgroundOpacity` (range 0–100, default 70), `_lockup` image (SVG, required), `srHeading` string (visually hidden `<h1>`, default "Organogenesis in Rhode Island") | — | — |
| `feature-section-widget` | `variant` select `collage` / `partners`; `sectionHeading`; `lead`; `video`; `cta`; `ctaPosition` select `afterLead` / `afterMedia`; if `collage`: `_collageImages` image relationship (exactly 5, order = slot 1…5); if `partners`: `partnersHeading` string, `_partners` relationship → `college-partner` (max 8) | joins partners | `video-embed`; mobile `carousel` for the collage |
| `impact-widget` | `sectionHeading` (white); `lead`; `video`; `stats` array `{ value string (max 8), label string (max 60) }` (min 1, max 4); `_background` image | — | `video-embed` |
| `community-feed-widget` | `sectionHeading` (left); `mode` select `latest` / `manual`; `limit` integer (1–12, default 6); `_posts` relationship → `community-post` (when `manual`) | `latest`: query `community-post` sorted by `postedAt`, `limit` | `carousel` |
| `news-feed-widget` | `sectionHeading`; `mode` `latest` / `manual`; `limit` (default 3); `_items` relationship → `news-item`; `cta` | `latest`: query `news-item` sorted by `date` | `carousel` (mobile only) |
| `careers-widget` | `sectionHeading` (split eyebrow/title as in Figma "join our / team"); `body` textarea; `_image` image; `imagePosition` select `right` / `left`; `cta` | — | — |
| `about-widget` | `sectionHeading` (eyebrow "About" + title "Organogenesis" rendered on one line); `body` textarea; `cta` (rendered as `button--outline-yellow`); `_watermark` image (logo mark); background is the `--g-navy` token, no image | — | — |
| `contact-widget` | `title` (default "CONTACT US"); `submitLabel` (default "Submit"); `mediaHeading` (default "Media Inquiries"); `mediaContact` object `{ name, role, email }` | reads `areasOfInterest` and `successMessage` from Global | `contact-form` |

The `load` step uses `self.apos.modules['news-item'].find(req, criteria).sort(...).limit(n).toArray()` inside the widget module's `load(req, widgets)` method, so drafts are hidden from the public and visible in edit mode.

### SVG uploads

Logos and the lock-up are SVG. Enable SVG on `@apostrophecms/attachment` (`fileGroups` → images accept `svg`) and sanitize on upload (`DOMPurify` server-side, already a core dependency) — a task in T1.4.

## 7. Contact form service (`contact-form` module)

Route: `apiRoutes → post → submit` → `POST /api/v1/contact-form/submit`.

Request (JSON or `application/x-www-form-urlencoded`): `fullName`, `email`, `areaOfInterest`, `website` (honeypot, must be empty), `ts` (form render timestamp).

Processing:

1. Reject if `website` is not empty or `Date.now() - ts < 3000` → respond `{ ok: true }` (silent drop).
2. Rate limit: 5 submissions per IP per 10 minutes (in-memory LRU; good enough for one instance) → `429`.
3. Validate with `self.apos.launder` + schema convert of `contact-submission` (required fields, email format, area in Global list) → `400 { ok: false, errors: { field: message } }`.
4. Insert `contact-submission` with `req` elevated (`self.apos.task.getReq()`), status `new`.
5. Send email with `self.email(req, 'notification', data, { to, subject })` using `@apostrophecms/email` (`nodemailer` from `SMTP_URL`; JSON transport logging when unset). Update `emailSent`.
6. JSON → `{ ok: true, message }`. Form-encoded (no JS) → `303` redirect to `/?sent=1#contact`.

CSRF: Apostrophe requires the `organo-ri.csrf` cookie on every non-GET request; any GET (the page load) sets it. Both the `fetch` path and the plain same-origin form POST therefore pass without `csrfExceptions`. Server tests must GET `/` first (or send the cookie) before posting.

## 8. CLI tasks (`site` module)

| Command | Does |
|---------|------|
| `node app site:seed` | Idempotent. Creates admin (`admin` / `$APOS_ADMIN_PASSWORD`), imports images from `fixtures/images`, creates 3 news items, 3 community posts, 5 college partners, Global settings and the home page `main` area with all 8 widgets filled with the Figma copy. Publishes everything. |
| `node app site:reset` | Refuses unless `NODE_ENV !== 'production'`. Deletes `data/site.db*` and `public/uploads/*`, then runs `site:seed`. |
| `node app site:purge-submissions --days=N` | Deletes `contact-submission` older than N days. |
| `apos-db-dump` / `apos-db-restore` | From `@apostrophecms/db-connect`; used for snapshots (`npm run db:snapshot`) and for moving to Postgres/MongoDB. |

Fixture copy comes from Figma (the Figma copy still has lorem ipsum in the Education lead; keep it until **Q-3** gives real copy).

Seed defaults (Q-10 – Q-12):

- Every `cta.url`, `news-item.link`, `community-post.url` and `college-partner.url`: `https://www.organogenesis.com/`.
- Every `video.media`: `https://www.youtube.com/watch?v=YqP8s2M4xig` (Facility, Impact, Education); posters from the Figma screenshots.
- Global `contactRecipients`: `vasj@sparkdsg.com`; `areasOfInterest`: Option A, Option B, Option C.
- All of these stay editable in the admin (widget fields, piece fields, Global settings).

## 9. Security and hardening

- `helmet`-style headers via `@apostrophecms/express` middleware: CSP allowing `youtube-nocookie.com`, `player.vimeo.com`, `i.ytimg.com`, `i.vimeocdn.com`; `frame-ancestors 'self'`.
- Admin at `/login`; no public user registration.
- Uploads: images only (jpg, png, webp, svg sanitized), 10 MB cap.
- No PII in logs; contact emails go only to configured recipients.
