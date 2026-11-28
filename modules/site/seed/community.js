// Community (LinkedIn) posts for `site:seed` —
// reference/spec/03-backend.md §5 (`community-post`) and §8 "Seed defaults".
// The three cards are Figma node map row 4 (`reference/screens/community@1440.png`):
// Petrosinelli, the facility aerial and the Governor's visit. Q-11 sets every
// link to the Organogenesis site.
//
// `postedAt` is relative to the seed run so a fresh `npm run setup` shows the
// "6d" of the Figma card; `lib/relative-date.js` formats it at render time.
//
// Only the Petrosinelli excerpt is visible in the Figma render. The other two
// excerpts are placeholders (Q-3 keeps Figma copy and marks what Figma does not
// supply); the titles and images come from `fixtures/images/INVENTORY.md`.
function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export default [
  {
    slug: 'community-post-petrosinelli-board-of-education',
    title: 'Organogenesis Congratulates Dr. Arthur-Paul Petrosinelli on His Appointment to the Rhode Island Board of Education',
    excerpt: 'Organogenesis is pleased to congratulate Arthur-Paul Petrosinelli, Ed.D., Assistant Vice President of Government and Community Relations, on his…',
    image: 'Community post: Dr. Arthur-Paul Petrosinelli',
    postedAt: daysAgo(6),
    source: 'linkedin',
    authorName: 'Organogenesis',
    url: 'https://www.organogenesis.com/'
  },
  {
    slug: 'community-post-new-biomanufacturing-facility-smithfield',
    title: 'New Biomanufacturing Facility Opened In Smithfield, RI',
    excerpt: 'Organogenesis Smithfield adds manufacturing, R&D and logistics capabilities in Rhode Island, supporting existing and future regenerative medicine products…',
    image: 'Community post: new facility',
    postedAt: daysAgo(20),
    source: 'linkedin',
    authorName: 'Organogenesis',
    url: 'https://www.organogenesis.com/'
  },
  {
    slug: 'community-post-governor-dan-mckee-smithfield',
    title: 'Today, we had the honor of welcoming RI Governor Dan McKee to our new Smithfield facility',
    excerpt: 'The Governor toured the site with our team and spoke about the role biomanufacturing plays in Rhode Island\'s economy and its workforce…',
    image: 'Community post: Governor Dan McKee',
    postedAt: daysAgo(60),
    source: 'linkedin',
    authorName: 'Organogenesis',
    url: 'https://www.organogenesis.com/'
  }
];
