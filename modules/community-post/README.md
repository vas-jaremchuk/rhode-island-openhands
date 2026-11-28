# `community-post`

Community (LinkedIn) posts listed by the community section
(`reference/spec/03-backend.md` §5). One page site, so the type has no piece
page: the cards link to `url`. `site:seed` fills the three Figma items from
`modules/site/seed/community.js`, with images from the media library.

Open the list from the admin bar: **Community Posts**. The list is sorted
newest first by `postedAt`.

## Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string, max 160 | Required; the post headline. |
| `excerpt` | string, textarea, max 240 | Required; the card clamps it to three lines. |
| `_image` | relationship → image, max 1 | Required; the card photo. Enforced on save. |
| `postedAt` | date | Required; shown as relative time (`6d`, `3w`, `Mar 4`). |
| `source` | select `linkedin` / `other` | Default `linkedin`; the network beside the date. |
| `authorName` | string | Default `Organogenesis`. |
| `_avatar` | relationship → image, max 1 | Optional; falls back to the Global `_defaultAvatar`. |
| `url` | url | Required; the original post (Q-11 defaults the seed to the Organogenesis site). |

## Relative dates

`lib/relative-date.js` exports `relativeDate(date, now)`. It returns `0d`…`6d`
for the last week, `1w`…`4w` up to 29 days, and `MMM D` after that — with the
year as well when the post is from another year. The date-only string a `date`
field stores is read as UTC, so the server timezone cannot move it a day.

The formatter is registered as a module helper, so a template can call it
without importing `lib/` itself:

```jsx
helpers.communityPost.relativeDate(post.postedAt)
```
