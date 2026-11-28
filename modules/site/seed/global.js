// Global settings for `site:seed` — reference/spec/03-backend.md §4 (Header,
// SEO and Contact groups) and §8 "Seed defaults". Image values are media-library
// titles, so the seed relates the pieces by the same idempotency key it uses to
// import them.
//
// Copy that Figma does not provide (the SEO title and description) is a plain
// placeholder that editors change in Global settings; Q-3 keeps Figma copy where
// the design has it.
import {
  DEFAULT_AREAS_OF_INTEREST,
  DEFAULT_CONTACT_RECIPIENTS,
  DEFAULT_SUCCESS_MESSAGE
} from '../../../lib/contact-settings.js';

export default {
  siteTitle: 'Organogenesis Rhode Island',
  metaDescription: 'Organogenesis in Rhode Island: our manufacturing facility, community, education partnerships, news and careers.',
  headerLogo: 'Organogenesis wordmark',
  headerLogoMobile: 'Organogenesis wordmark mobile',
  ogImage: 'Hero background',
  // Fallback avatar for community posts that have no `_avatar` of their own
  // (`community-post` in reference/spec/03-backend.md §5).
  defaultAvatar: 'Organogenesis avatar',
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
  ],
  // Q-10: the contact form recipients and Area of interest options, plus the
  // message the form shows after a successful send.
  contactRecipients: DEFAULT_CONTACT_RECIPIENTS,
  areasOfInterest: DEFAULT_AREAS_OF_INTEREST,
  successMessage: DEFAULT_SUCCESS_MESSAGE
};
