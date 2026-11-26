# 04. Front end (native Apostrophe)

## Templates

```
views/layout.jsx                   # <Extend templateName={outerLayout}>: header, main, footer
views/components/Header.jsx        # utility links + logo bar (from Global)
views/components/Footer.jsx        # empty navy block, 354 px / 270 px (Q-6)
views/components/ui.jsx            # SectionHeading, Button, LinkMore, VideoEmbed, Picture, Icon
modules/@apostrophecms/home-page/views/page.jsx   # <Area doc={page} name="main" />
modules/@apostrophecms/page/views/notFound.jsx    # keep (core's notFound.html can't extend a JSX layout)
modules/<name>-widget/views/widget.jsx
```

Rules:

- Each section widget outputs one `<section class="s-<name> s-<name>--<variant>" id="{{ anchor }}" aria-labelledby="...">`. No wrapper divs that only exist for Figma's absolute positioning: layout is flex/grid.
- Headings: one visually hidden `<h1>` in the hero; every section title is `<h2>`; card titles `<h3>`.
- Images through the `Picture` component: `apos.image.srcset()` + `sizes`, `loading="lazy"` except hero and Facility video poster (`fetchpriority="high"` on hero background), `alt` from the image piece (empty for decorative backgrounds).
- Copy is never hard-coded in templates: everything comes from widget fields or Global (labels such as "READ MORE" via i18n `en.json`).

## Styles

```
modules/asset/ui/src/index.scss
  ├── _tokens.scss        # CSS custom properties from 02 (colours, type, spacing, breakpoints)
  ├── _fonts.scss         # @font-face, font-display: swap, WOFF2 only
  ├── _type.scss          # .t-eyebrow, .t-title-xl … generated from a Sass map with clamp()
  ├── _base.scss          # reset, body, focus-visible
  ├── _layout.scss        # .container, .container--wide, .section spacing
  └── _components.scss    # .btn, .link-more, .video-embed, .carousel, .form-field
modules/<name>-widget/ui/src/index.scss   # section-specific layout only (BEM: .s-impact__stats)
```

Conventions:

- BEM with `s-` prefix for sections, `c-` for components, `t-` for type utilities.
- Only tokens in widget Sass (no raw hex, no raw px font sizes). `scripts/check-tokens.mjs` fails the build on hex colours or `font-size: <n>px` outside `_tokens.scss`.
- Mobile first; `@include mq(md)` / `mq(lg)` mixins.
- Respect `prefers-reduced-motion` (no smooth scroll or carousel animation).

## Section layouts (desktop → mobile)

| Section | Desktop (≥ 1200) | Mobile (< 768) |
|---------|------------------|----------------|
| Header | Utility row (right-aligned links, outline CONTACT US) over a translucent dark 92 px bar with wordmark left; both overlay the hero | 50 px bar, wordmark left, no menu (Q-5) |
| Hero | Full-bleed photo + gradient, centred lock-up 411 px wide, height 617 | Height 226, lock-up 203 px |
| Facility | Centred heading + lead (max 708), video 1100, 5-image collage (CSS grid with named areas reproducing the Figma positions; plain crops, no masks), centred button | Heading, lead, video, **image carousel** (1 image 333² + peek, progress bar + chevrons), button |
| Impact | Gradient bg, centred white heading + lead, video, 4 stats in a row (`grid-template-columns: repeat(4, 196px)`, space-between across 1100) | Stats stacked, 309 wide, 24 px gap |
| Community | Heading left, controls top right, one 1101-wide post card visible, next card peeking off-screen right (see screenshot) | Cards 333 wide, image on top, next card peeks, controls + progress under |
| Education | Centred heading, lead, button, video, partners heading, logo strip full-bleed (logos overflow the edges) | Same order; 3 logos visible, strip overflows |
| News | Centred heading, 3 cards in a row (422 each, wide container), centred button | Carousel of cards, controls + progress, button |
| Careers | Two columns: text left (centred in its column), image 535² right | Stacked: heading, text, image, button |
| About | Navy gradient (`--g-navy`) + watermark logo mark centred behind the text, centred one-line heading, body (max 874), yellow-outline button | Same, narrower |
| Contact | Two columns split by a 1 px vertical divider: form (648) left, Media Inquiries right | Stacked: form, then Media Inquiries |
| Footer | Empty `--c-footer` block, 354 px tall | 270 px tall |

## JavaScript (widget players)

One ES module per behaviour in `modules/asset/ui/src/js/`, registered by the widgets that use them:

```js
// modules/impact-widget/ui/src/index.js
import { initVideoEmbed } from '../../../asset/ui/src/js/video-embed.js';
export default () => {
  apos.util.widgetPlayers.impact = {
    selector: '[data-s-impact]',
    player(el) { el.querySelectorAll('[data-video-embed]').forEach(initVideoEmbed); }
  };
};
```

| Module | Behaviour | Acceptance |
|--------|-----------|------------|
| `video-embed.js` | Poster is a `<button>` with `aria-label="Play video: <title>"`. Click/Enter → build iframe from the oEmbed provider id (`youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`, `player.vimeo.com/video/<id>?autoplay=1&dnt=1`), move focus to the iframe. No third-party request before click | Lighthouse: no YouTube requests on load |
| `carousel.js` | CSS scroll-snap track (`overflow-x: auto; scroll-snap-type: x mandatory`), JS only for prev/next buttons, progress bar width (= visible / total) and disabled states. Keyboard: buttons are real `<button>`s; track is `role="region" aria-roledescription="carousel"` with `aria-label`; each slide `role="group" aria-label="2 of 6"`. Touch swipe is native scrolling. Variants via `data-carousel="mobile-only"` (News, Facility collage) | Works with JS disabled (scrollable) |
| `contact-form.js` | Progressive enhancement: intercept submit, `fetch` JSON to `/api/v1/contact-form/submit`, show inline field errors (`aria-describedby`, `aria-invalid`), live region for success/error, disable button while sending. Without JS the form posts normally | e2e tests both paths |

No other client JS. Target total JS < 15 KB gzipped (excluding Apostrophe's editing bundle, which only loads for logged-in users).

## Accessibility (WCAG 2.2 AA)

- Colour: yellow is decorative only; focus ring yellow on blue / blue on light backgrounds with 3:1 against neighbours.
- All interactive elements ≥ 44 × 44 (mobile chevrons are 23 × 48 in Figma: extend the hit area with padding).
- Form: visible labels are the placeholders in Figma; use real `<label>`s styled as floating labels so text remains after typing. Required marked with `*` and `aria-required`.
- Videos: `title` on iframes; no autoplay before interaction.
- Carousels: no auto-rotation.
- `axe-core` run in e2e must report zero serious/critical violations.

## Performance budget (mobile, Lighthouse, throttled)

| Metric | Budget |
|--------|--------|
| LCP | < 2.5 s (hero background preloaded as WebP, 2 sizes) |
| CLS | < 0.05 (width/height on all images, fonts with `size-adjust` fallbacks) |
| Total page weight (first load, no video) | < 1.5 MB |
| Fonts | ≤ 5 WOFF2 files, latin subset |

## Pixel fidelity

Visual tests compare against Figma exports at 1440 and 375 (see 05). Tolerance: layout positions within 4 px per section, colours exact (tokens), type sizes exact at the two design widths.
