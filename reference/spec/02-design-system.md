# 02. Design system

All values below were read from Figma through the Figma MCP (variables and node styles) on 2026-11-24, desktop frame `2279:53` and mobile frame `2161:235`. The only values not read from node styles are the hero background (an image fill) and the footer (a flattened shape); both are exported as assets in T0.2.

## Colour tokens

| Token | Value | Use |
|-------|-------|-----|
| `--c-blue` | `#002855` | Figma variable "Organo Blue": headings, buttons, links, card titles, progress thumb |
| `--c-yellow` | `#FFCD03` | Figma variable "Organo Bright Yellow": news-card left border, stat rules, About button border, Media Inquiries rule. Decorative only (1.5:1 on white) |
| `--c-blue-mid` | `#22528E` | News date + icon |
| `--c-text` | `#63666B` | Body / lead text on light backgrounds, form borders and labels |
| `--c-surface` | `#F8F8F8` | Cards, desktop carousel buttons, Education section background |
| `--c-header` | `#47566E` | Header logo bar (92 px) |
| `--c-track` | `#E2E2E2` | Carousel progress track |
| `--c-white` | `#FFFFFF` | Text on dark backgrounds, page background, form fields |
| `--c-overlay` | `rgba(0,0,0,.4)` | Video poster overlay |
| `--g-brand` | `linear-gradient(-80.6deg, rgba(21,40,107,.9) 16.44%, rgba(0,160,158,.8) 104.87%, rgba(21,40,107,.9) 111.55%)` (mobile angle −87.9deg) | Figma variable "Organo Gradient": Hero and Impact, over a photo at 70% opacity |
| `--g-navy` | `linear-gradient(1.38deg, #041C2C 2.37%, #002855 72.77%)` | About section |
| `--g-contact` | `linear-gradient(to bottom, #EFF2F4, #FFFFFF)` | Contact section |
| `--c-footer` | `#041C2C` | Footer block (the whole footer, Q-6) |

Contrast (WCAG AA, computed): `#63666B` on `#FFFFFF` 5.76:1 ✓, on `#F8F8F8` 5.43:1 ✓; `#22528E` on `#F8F8F8` 7.42:1 ✓; white on `#002855` 14.6:1 ✓; white on `#47566E` 7.44:1 ✓; `#FFCD03` on white 1.5:1 ✗ (decorative only). White on pure teal `#00A09E` is 3.22:1: fine for titles, **not** for 18–22 px body text. The gradient sits over a photo, so T1.3 measures the rendered pixels behind the Impact lead and stats; if any area is below 4.5:1, raise the overlay opacity there.

## Typography

Families:

| Token | Family | Licence | Fallback |
|-------|--------|---------|----------|
| `--f-display` | Roboto Condensed (400, 500, 700) | OFL, self-host | `"Arial Narrow", sans-serif` |
| `--f-body` | Roboto (400, 500, 700) | OFL, self-host | `system-ui, sans-serif` |
| `--f-alt` | **Libre Franklin** (400, 700), replacing BentonSans (Q-1): card/post titles, header links, form labels | OFL, self-host | Roboto |
| icons | **Font Awesome Free 7** in place of Pro (Q-2): `newspaper`, `calendar-days` (regular); `chevron-left`, `chevron-right`, `chevron-down`, `globe` (solid). Feather `arrow-right` | FA Free CC BY 4.0 (attribution comment in the sprite), Feather MIT | Inline SVG sprite `modules/asset/ui/public/icons.svg`, `<use href>` |

Type styles. Letter-spacing is in px in Figma; the em value is what the tokens use.

| Style | Family / weight | Desktop size / line | Mobile size / line | Tracking | Case |
|-------|-----------------|---------------------|--------------------|----------|------|
| `eyebrow` | Roboto Condensed 500 | 22 / 54–62 | 18 / 18 | 2.42 px desktop, 1.98 px mobile (0.11em) | upper |
| `title-xl` (Facility, Education, News) | Roboto Condensed 700 | 62 / 62 | 38 / 46 | 5.06 px (Facility, Education), 8.68 px (News) | upper |
| `title-l` (Impact, Community, Careers) | Roboto Condensed 700 | 46 / 54 | 38 / 46 | 6.44 px (Impact, Careers), 5.06 px (Community) | upper |
| `title-l-wide` (Contact, About) | Roboto Condensed 700 | 46 / 48 | 38 / 46 | 7.82 px desktop, 6.46 px mobile (0.17em) | upper |
| `subhead` (Media Inquiries) | Roboto Condensed 500 | 24 / 32 | 24 / 32 | 0 | upper |
| `partners-heading` | = `eyebrow` | 22 / 62 | 18 / 18 | 0.11em | upper |
| `lead` | Roboto 400 | 24 / 35 (Facility, Education); 22 / 36 (Impact); 22 / 32 (Careers, About) | 22 / 32 | 0 | — |
| `body` | Roboto 400 | 18 / 28 | 18 / 28 | 0 | — |
| `body-l` | Roboto 400 | 22 / 32 (post excerpt) | 18 / 28 | 0 | — |
| `card-title` | Libre Franklin 700 | 22 / 28 | 22 / 28 | 0 | — |
| `post-title` | Libre Franklin 400 | 32 / 38 | — (mobile shows the title as `body`, 18 / 28) | 0 | — |
| `post-author` | Roboto 700 | 24 / 32 | 20 / 20 | 0 | — |
| `stat` | Roboto Condensed 400 | 64 / normal | 64 / normal | −1.92 px (−0.03em) | — |
| `stat-label` | Roboto 400 | 18 / 24 | 18 / 28 | 0 | — |
| `meta` (date) | Roboto Condensed 500 | 18 / 31 | 18 / 31 | 0 | — |
| `meta-post` ("6d • globe") | Roboto 400 | 18 / 32 | 18 / 18 | 0 | — |
| `contact-name` | Roboto 700 | 22 / 32 | 22 / 32 | 0 | — |
| `contact-role` / `contact-email` | Roboto 500 | 18 / 32 and 22 / 32 (email underlined) | same | 0 | — |
| `form-label` | Libre Franklin 400 | 14 / 42 | 14 / 42 | 0 | — |
| `nav` (header) | Libre Franklin 700 | 12 / 42 | — (hidden) | 0.6 px (0.05em) | upper |
| `button` | Roboto 700 | 18 / 42 | 16 / 24 | 0 | upper |
| `link` (READ MORE) | Roboto 700 | 18 / 18, underlined | same | 0 | upper |

Title letter-spacing varies by section in Figma (Q-4 default: keep as designed). The section widgets set `--title-tracking` per section; the type utility reads it.

Fluid sizing: between 375 and 1440 use `clamp()` (e.g. `title-xl: clamp(2.375rem, 1.85rem + 2.25vw, 3.875rem)`). Pairs are generated by `modules/asset/ui/src/_type.scss` from the table above.

## Layout

| Token | Desktop (1440) | Mobile (375) |
|-------|----------------|--------------|
| Container | 1100 px (content at x = 170) | 100% − 2 × 14 px (347) |
| Wide container (News cards, header) | 1326 px (x = 57) | — |
| Section padding top | 90 px | 60 px |
| Section padding bottom | 90 px | 60 px |
| Heading → lead | 24 px | 20 px |
| Lead → video | 36 px | 36 px |
| Video | 1098 × 618 (16:9), play 72 px | 347 × 198, play 60 px |

Breakpoints (designs exist only for 375 and 1440):

| Name | Range | Behaviour |
|------|-------|-----------|
| `sm` | < 768 | 375 design, fluid |
| `md` | 768 – 1199 | Mobile structure with wider container; 2-up cards where the desktop shows 3 |
| `lg` | ≥ 1200 | 1440 design; container capped at 1100 |
| `xl` | ≥ 1440 | Centred, backgrounds bleed full width |

## Components

| Component | Desktop | Mobile |
|-----------|---------|--------|
| `button` (solid) | bg `--c-blue`, white `button` text, h 60, padding 0 16 0 24 with arrow / 0 36 without, gap 8, 24 px Feather arrow-right. Hover bg `#22528E`; focus 3 px `--c-yellow` outline, offset 2 | h 54, padding 0 19 with arrow / 0 36 without |
| `button--outline-yellow` (About "LEARN MORE") | transparent, 2 px `--c-yellow` border, white text, h 60, padding 0 36 | h 54 |
| `button--outline-white` (header CONTACT US) | 1 px white border, radius 1, 116 × 32, `nav` style | hidden |
| `link-more` | `link` style, blue | same |
| `section-heading` | eyebrow line + title line (two `<span>`s in one `<h2>`), centred or left, blue or white | same, mobile sizes |
| `video-embed` | Poster (cover) + 40% black overlay + centred 72 px play button. Click → iframe (`youtube-nocookie.com` / Vimeo `dnt=1`), `autoplay=1` | 347 × 198, play 60 |
| `stat` | number / 2 px yellow rule (196 wide) / label; width 196; 4 in a row | width 309, rule 282, label width 226; stacked with 24 px gap |
| `news-card` | bg surface, 2 px yellow left border, padding 42 42 29, gap 60, w 422; icon 28 + date (`meta`, blue-mid), `card-title`, excerpt (`body`, 3-line clamp), `link-more` | w 333, padding 29 30, gap 48 |
| `post-card` | 1101 × 494, bg surface; square image 494 left (`mix-blend-mode: multiply`); content padding 36 42, gap 24: avatar 60 circle + `post-author` + `meta-post`, `post-title`, excerpt (`body-l`), `link-more` at the bottom | 333 × 580: image 333² on top, content padding 24, gap 24, avatar 48, title shown as `body` |
| `carousel-controls` | Two 60 × 60 surface squares, blue chevrons 20 px, gap 10, top right of the section | Chevrons 20 px (23 / 24 wide, 48 tall, gap 12) right; progress bar left: track 276 × 4 `--c-track`, thumb `--c-blue` (width = visible / total) |
| `logo-strip` | 5 logos, gap 96, heights 84–122, row 1522 wide so it bleeds past both edges | 3 logos visible (≈ 105 × 50), bleeds past edges |
| `form-field` | w 648, white bg, 1 px `--c-text` border, radius 8, padding 7 34, gap 16 between fields, `form-label`; select has 16 px chevron-down right | w 346, padding 7 14 |
| `media-contact` | `subhead` "MEDIA INQUIRIES" (blue), 75 px yellow rule, name / role / email (grey) | same, under the form |
| `image-collage` (Facility) | 5 images in a 1324 × 599 area: 194² top-left (x 80, y 85), 242² bottom-left (x 0, y 327), 647 × 599 centre (x 307), 309² top-right (x 1015, y 25), 199² bottom-right (x 1042, y 370). Plain crops (`object-fit: cover`), no masks | Replaced by an image carousel (333² slides + controls) |

## Figma node map (Home)

Desktop frame `2279:53` (1440 × 9129). Mobile frame `2161:235` (375 × 7909.5).

| # | Section (widget) | Desktop node | y / height | Mobile node | y / height | Notes |
|---|------------------|--------------|------------|-------------|------------|-------|
| 1 | Header (global) + Hero (`hero-widget`) | `2279:254` header, `2279:190` hero | 0 / 617 | `2161:236` bar, `2161:237` logo, `2161:253` gradient, `2161:254` mark | 0 / 276.5 | Utility row (65 px, transparent over hero): OUR STORY, INVESTORS & MEDIA, CONTACT US (outline). Logo bar 92 px `#47566E`, wordmark 252 × 22 at x 57. Centred 100-year lock-up (411 × 296, SVG). Mobile: 50 px bar, logo only, no menu (Q-5) |
| 2 | Facility (`feature-section-widget`, `collage`) | `2279:171` | 617 / 1820 | `2215:222` | 276.5 / 1140 | White bg. "ABOUT OUR / RHODE ISLAND FACILITY", lead, video `2279:174`, collage `2279:179`, button "TOUR OUR FACILITY". Mobile collage → carousel `2291:142` |
| 3 | Impact (`impact-widget`) | `2279:146` | 2437 / 1330 | `2184:138` | 1416.5 / 1533 | `--g-brand` over photo. "HOW WE'RE / MAKING A DIFFERENCE", lead, video `2279:164`, 4 stats |
| 4 | Community (`community-feed-widget`) | `2279:277` | 3767 / 814 | `2221:69` | 2949.5 / 856 | White bg. "FROM OUR / COMMUNITY" left, controls top right, post cards `2279:283`, `2279:299`, `2612:1619` |
| 5 | Education (`feature-section-widget`, `partners`) | `2279:75` | 4581 / 1484 | `2161:389` | 3805.5 / 880 | `--c-surface` bg. "WHERE / EDUCATION CONNECTS", lead, button "LEARN ABOUT OUR PARTNERSHIPS", video `2279:84`, "OUR COLLEGE PARTNERSHIPS" + logos `2279:77` |
| 6 | News & Events (`news-feed-widget`) | `2279:94` | 6065 / 795 | `2215:244` | 4685.5 / 700 | White bg. "THE LATEST / NEWS & EVENTS", 3 cards, button "VIEW ALL NEWS & EVENTS". Mobile carousel `2292:144` |
| 7 | Careers (`careers-widget`) | `2279:68` | 6860 / 715 | `2215:294` | 5385.5 / 845 | White bg. "JOIN OUR / TEAM" + lead + button "BROWSE CAREERS" (no arrow) centred in the left column (422), image 535² right |
| 8 | About (`about-widget`) | `2279:56` | 7575 / 640 | `2292:513` | 6230.5 / 656 | `--g-navy`, logo mark watermark centred (314 × 415). "ABOUT ORGANOGENESIS" (eyebrow + title on one line), lead, yellow-outline button "LEARN MORE" |
| 9 | Contact (`contact-widget`) | `2279:126` | 8215 / 560 | `2161:359` | 6886.5 / 753 | `--g-contact`. "CONTACT US", 3 fields, Submit (no arrow); 1 px vertical divider (380 tall) at x 933; Media Inquiries at x 1004 |
| 10 | Footer (global) | `2279:54` | 8775 / 354 | `2161:379` | 7639.5 / 270 | Plain `#041C2C` block, 354 px desktop / 270 px mobile, no content (Q-6) |

Assets are exported to `fixtures/images/` in the project repository (see its `INVENTORY.md`); section renders are in `reference/screens/`.
