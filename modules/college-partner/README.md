# `college-partner`

College partners whose logos the education section shows
(`reference/spec/03-backend.md` §5). One page site, so the type has no piece
page: the logos live in the education widget's `_partners` relationship, and the
relationship's order is the display order. `site:seed` fills the five logos of
the Figma strip from `modules/site/seed/partners.js`.

Open the list from the admin bar: **College Partners**.

## Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Required; the partner name, also the logo's alt text (no "logo" suffix). |
| `_logo` | relationship → image, max 1 | Required; the partner logo from the media library. Enforced on save. |
| `url` | url | Optional; when set the logo becomes a link (Q-11 defaults the seed to the Organogenesis site). |
