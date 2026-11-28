# `@apostrophecms/global`

Site-wide settings for the header, the document head, the community avatar and
the contact form (`reference/spec/03-backend.md` §4 and §5). The layout reads the
document as `data.global`; `site:seed` fills the defaults from
`modules/site/seed/global.js`.

Open the editor from the admin bar: **Global Content**.

## Fields

| Group | Field | Type | Notes |
|-------|-------|------|-------|
| Header | `_headerLogo` | relationship → image, max 1 | Wordmark in the desktop logo bar. SVG uploads are allowed. |
| Header | `_headerLogoMobile` | relationship → image, max 1 | Smaller export for the 50 px mobile bar; falls back to `_headerLogo`. |
| Header | `utilityLinks` | array of `{ label, url, style }` | `style` is `link` or `outline` (the white 1 px bordered button). Hidden below the `lg` breakpoint (Q-5). |
| SEO | `siteTitle` | string, max 80 | Page `<title>`; page templates can still override it with a `title` prop. |
| SEO | `metaDescription` | string, textarea, max 200 | `<meta name="description">`. |
| SEO | `_ogImage` | relationship → image, max 1 | `<meta property="og:image">`, as an absolute URL. |
| Community | `_defaultAvatar` | relationship → image, max 1 | Avatar for community posts that have no `_avatar` of their own. |
| Contact | `contactRecipients` | string (comma-separated emails), max 500 | Default `vasj@sparkdsg.com` (Q-10); `CONTACT_TO` is the fallback when empty. Server-side only: it is not in page data or the public API. |
| Contact | `areasOfInterest` | array of `{ label, value }` | The contact form options, seeded Option A / B / C (`option-a` …). The contact form accepts only these values (Q-10). |
| Contact | `successMessage` | string, max 200 | Message shown after a successful submission; default "Thank you. We will be in touch." |

## Methods

| Method | Returns |
|--------|---------|
| `getContactSettings(req)` | `{ recipients: string[], areas, successMessage }` for the contact form service and widget. `recipients` is split on commas, trimmed and falls back to `CONTACT_TO`; it never goes to the browser. |

## Templates

| Template | Renders |
|----------|---------|
| `views/components/Header.jsx` | The utility row and the logo bar from the Header group. |
| `views/components/Footer.jsx` | The empty `--c-footer` block (Q-6); no Global fields. |
| `views/layout.jsx` | Header, `<main>`, footer, and the title, description, Open Graph image and canonical URL in `<head>`. |
