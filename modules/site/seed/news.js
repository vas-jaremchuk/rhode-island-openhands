// News & Events pieces for `site:seed` — reference/spec/03-backend.md §5
// (`news-item`) and §8 "Seed defaults". Copy is the three cards of Figma node
// map row 6, as rendered in `reference/screens/news@1440.png`; Q-11 sets every
// link to the Organogenesis site.
//
// `slug` is the seed's idempotency key. The first and third cards share a title,
// so a title-derived slug would collide; these explicit slugs keep each item
// stable across runs.
//
// The excerpts are what the Figma frame shows. It truncates them at three lines,
// so the seed stores the visible text, ellipsis included; editors can extend it
// in the admin up to 200 characters.
export default [
  {
    slug: 'news-item-biomanufacturing-facility-smithfield-2025-12-18',
    title: 'Organogenesis Unveils Plans for New Biomanufacturing Facility in Smithfield, RI',
    kind: 'news',
    date: '2025-12-18',
    excerpt: 'Organogenesis Smithfield will add manufacturing, R&D and logistics capabilities supporting existing and…',
    link: 'https://www.organogenesis.com/',
    newTab: false
  },
  {
    slug: 'news-item-phase-i-construction-complete-2025-11-10',
    title: 'The Organogenesis Team Celebrates The Completion of Phase I of Construction',
    kind: 'event',
    date: '2025-11-10',
    excerpt: 'We celebrating a significant milestone as we continue to make progress toward the opening of our state-of-the-art…',
    link: 'https://www.organogenesis.com/',
    newTab: false
  },
  {
    slug: 'news-item-biomanufacturing-facility-smithfield-2025-04-08',
    title: 'Organogenesis Unveils Plans for New Biomanufacturing Facility in Smithfield, RI',
    kind: 'news',
    date: '2025-04-08',
    excerpt: 'Organogenesis Smithfield will add manufacturing, R&D and logistics capabilities supporting existing and…',
    link: 'https://www.organogenesis.com/',
    newTab: false
  }
];
