// Global settings for `site:seed` — reference/spec/03-backend.md §4 (Header and
// SEO groups) and §8 "Seed defaults". Image values are media-library titles, so
// the seed relates the pieces by the same idempotency key it uses to import them.
//
// Copy that Figma does not provide (the SEO title and description) is a plain
// placeholder that editors change in Global settings; Q-3 keeps Figma copy where
// the design has it.
export default {
  siteTitle: 'Organogenesis Rhode Island',
  metaDescription: 'Organogenesis in Rhode Island: our manufacturing facility, community, education partnerships, news and careers.',
  headerLogo: 'Organogenesis wordmark',
  headerLogoMobile: 'Organogenesis wordmark mobile',
  ogImage: 'Hero background',
  // Q-11: OUR STORY and INVESTORS & MEDIA leave the page; CONTACT US scrolls to
  // the on-page form (`#contact`).
  utilityLinks: [
    {
      label: 'OUR STORY',
      url: 'https://www.organogenesis.com/',
      style: 'link'
    },
    {
      label: 'INVESTORS & MEDIA',
      url: 'https://www.organogenesis.com/',
      style: 'link'
    },
    {
      label: 'CONTACT US',
      url: '#contact',
      style: 'outline'
    }
  ]
};
