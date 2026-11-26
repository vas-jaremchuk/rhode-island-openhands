# Questions

Answers from Vasyl on 2026-11-24 are marked **Answered**. The rest keep the proposed default; work proceeds with it unless someone says otherwise.

| # | Question | Answer / default | Status | Affects |
|---|----------|------------------|--------|---------|
| Q-1 | Web licence for **BentonSans** (card and post titles)? | Use a free, similar font: **Libre Franklin** (OFL; Franklin Gothic is the sibling of News Gothic, which BentonSans revives). Weights 400 and 700, same sizes as Figma | **Answered** | T1.3 |
| Q-2 | **Font Awesome 7 Pro** licence? | Use **Font Awesome Free 7** icons as an inline SVG sprite: `newspaper` and `calendar-days` (regular), `chevron-left/right` and `globe` (solid). Pro "Light" weight is not in Free, so regular is the closest. Arrow-right stays Feather (MIT), as in Figma. CC BY 4.0 attribution kept in the sprite file | **Answered** | T1.4 |
| Q-3 | Final copy for the Education lead (lorem ipsum) and photo alt text? | Keep Figma copy; mark placeholders in the seed | Default | T5.1 |
| Q-4 | Section titles use 3 letter-spacings (0.08 / 0.11 / 0.14 em). Unify? | Keep per-section values as in Figma | Default | T1.3 |
| Q-5 | Mobile header: menu for the utility links? | **No menu.** Mobile header shows the logo only; utility links appear from the `lg` breakpoint | **Answered** | T1.5 |
| Q-6 | Footer content? | **Use the flattened shape as is.** The export shows it is a plain `#041C2C` block with no content (1440×354 desktop, 375×270 mobile), so the footer is an empty navy block of that height; no image, no Global fields | **Answered** | T1.5 |
| Q-7 | Retention of contact submissions; privacy notice/consent? | 365 days; no checkbox | Default | T2.4 |
| Q-8 | Hosting for staging and production? | One container with a persistent volume (SQLite + uploads) | Default | T5.5 |
| Q-9 | Analytics and cookie consent? | None at launch; Global field ready for GA4 | Default | — |
| Q-10 | "Area of interest" options and email recipient? | Options **Option A, Option B, Option C**; emails go to **vasj@sparkdsg.com** by default; both editable in Global settings → Contact | **Answered** | T2.5 |
| Q-11 | Button and link targets? | **All buttons and READ MORE links → https://www.organogenesis.com/**, editable per widget / per piece. Exception: header "CONTACT US" scrolls to the on-page form (`#contact`); change it in Global if it should leave the page | **Answered** | T5.1 |
| Q-12 | Video URLs? | **https://www.youtube.com/watch?v=YqP8s2M4xig** as placeholder for all three videos (Facility, Impact, Education), editable in each widget | **Answered** | T5.1 |
| Q-13 | English only? | English only; i18n module kept for labels | Default | — |
