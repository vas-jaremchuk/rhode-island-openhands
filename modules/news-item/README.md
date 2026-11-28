# `news-item`

News & Events pieces listed by the news section
(`reference/spec/03-backend.md` §5). One page site, so the type has no piece
page: the cards link to `link`. `site:seed` fills the three Figma items from
`modules/site/seed/news.js`.

Open the list from the admin bar: **News Items**. The list is sorted newest
first and shows the Title, Kind and Date columns.

## Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string, max 120 | Required; the card headline. |
| `kind` | select `news` / `event` | Required; picks the newspaper or calendar icon. |
| `date` | date | Required; shown as `MMMM D, YYYY`. |
| `excerpt` | string, textarea, max 200 | Required; the card clamps it to three lines. |
| `link` | url | Required; READ MORE target (Q-11 defaults it to the Organogenesis site). |
| `newTab` | boolean | Default `false`; opens `link` in a new tab. |
