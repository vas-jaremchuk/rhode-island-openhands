// College partners for `site:seed` — reference/spec/03-backend.md §5
// (`college-partner`) and §8 "Seed defaults". The five logos are the Figma logo
// strip of node `2279:77` (`reference/screens/education@1440.png`), in the order
// the strip shows them. Q-11 sets every link to the Organogenesis site.
//
// `slug` is the seed's idempotency key. `image` is the title `seed/images.js`
// imported the logo under; the partner title is the logo's alt text, so it is
// the plain partner name with no "logo" suffix.
export default [
  {
    slug: 'college-partner-brown-university',
    title: 'Brown University',
    image: 'Brown University logo',
    url: 'https://www.organogenesis.com/'
  },
  {
    slug: 'college-partner-university-of-rhode-island',
    title: 'University of Rhode Island',
    image: 'University of Rhode Island logo',
    url: 'https://www.organogenesis.com/'
  },
  {
    slug: 'college-partner-rhode-island-college',
    title: 'Rhode Island College',
    image: 'Rhode Island College logo',
    url: 'https://www.organogenesis.com/'
  },
  {
    slug: 'college-partner-community-college-of-rhode-island',
    title: 'Community College of Rhode Island',
    image: 'Community College of Rhode Island logo',
    url: 'https://www.organogenesis.com/'
  },
  {
    slug: 'college-partner-providence-college',
    title: 'Providence College',
    image: 'Providence College logo',
    url: 'https://www.organogenesis.com/'
  }
];
