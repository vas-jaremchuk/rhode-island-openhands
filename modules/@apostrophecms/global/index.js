// Site-wide settings for the header, the document head and the contact form —
// reference/spec/03-backend.md §4 (Header, SEO and Contact groups). The layout
// reads them as `data.global`; `site:seed` fills the defaults
// (modules/site/seed/global.js).
import { contactSettings } from '../../../lib/contact-settings.js';

export default {
  fields: {
    add: {
      _headerLogo: {
        type: 'relationship',
        label: 'Wordmark',
        help: 'Organogenesis wordmark in the desktop logo bar. SVG uploads are allowed.',
        withType: '@apostrophecms/image',
        max: 1
      },
      _headerLogoMobile: {
        type: 'relationship',
        label: 'Wordmark (mobile)',
        help: 'Smaller export for the 50 px mobile bar. Falls back to the desktop wordmark.',
        withType: '@apostrophecms/image',
        max: 1
      },
      utilityLinks: {
        type: 'array',
        label: 'Utility links',
        help: 'Right-aligned links in the header. They are hidden below the lg breakpoint (Q-5).',
        titleField: 'label',
        fields: {
          add: {
            label: {
              type: 'string',
              label: 'Label',
              required: true
            },
            url: {
              type: 'url',
              label: 'URL',
              required: true
            },
            style: {
              type: 'select',
              label: 'Style',
              help: 'Outline renders the white 1 px bordered button used by CONTACT US.',
              choices: [
                {
                  label: 'Link',
                  value: 'link'
                },
                {
                  label: 'Outline button',
                  value: 'outline'
                }
              ],
              def: 'link'
            }
          }
        }
      },
      siteTitle: {
        type: 'string',
        label: 'Site title',
        help: 'Used in the page title, for example "Organogenesis Rhode Island".',
        max: 80,
        required: true
      },
      metaDescription: {
        type: 'string',
        label: 'Meta description',
        textarea: true,
        max: 200
      },
      _ogImage: {
        type: 'relationship',
        label: 'Open Graph image',
        help: 'Shared on social networks; 1200 × 630 works best.',
        withType: '@apostrophecms/image',
        max: 1
      },
      // Fallback for `community-post._avatar`
      // (reference/spec/03-backend.md §5).
      _defaultAvatar: {
        type: 'relationship',
        label: 'Default avatar',
        help: 'Shown on community posts that do not have their own avatar.',
        withType: '@apostrophecms/image',
        max: 1
      },
      // Q-10: the recipients, options and success message of the contact form.
      // `contactRecipients` is server-side only: no public projection or page
      // data includes it (`getContactSettings` is the server API).
      contactRecipients: {
        type: 'string',
        label: 'Contact form recipients',
        help: 'Comma-separated email addresses that receive contact form submissions. When empty the CONTACT_TO environment variable is used. Visitors never see this list.',
        max: 500
      },
      areasOfInterest: {
        type: 'array',
        label: 'Areas of interest',
        help: 'The options of the contact form "Area of interest" field, in order. The submitted value must be one of these (Q-10).',
        titleField: 'label',
        fields: {
          add: {
            label: {
              type: 'string',
              label: 'Label',
              help: 'Text the visitor sees in the select field.',
              required: true,
              max: 80
            },
            value: {
              type: 'string',
              label: 'Value',
              help: 'Stored on the submission; keep it stable and unique.',
              required: true,
              max: 80
            }
          }
        }
      },
      successMessage: {
        type: 'string',
        label: 'Success message',
        help: 'Shown in the contact form after a visitor sends it. Empty falls back to "Thank you. We will be in touch.".',
        max: 200
      }
    },
    group: {
      header: {
        label: 'Header',
        fields: [
          '_headerLogo',
          '_headerLogoMobile',
          'utilityLinks'
        ]
      },
      seo: {
        label: 'SEO',
        fields: [
          'siteTitle',
          'metaDescription',
          '_ogImage'
        ]
      },
      community: {
        label: 'Community',
        fields: [
          '_defaultAvatar'
        ]
      },
      contact: {
        label: 'Contact',
        fields: [
          'contactRecipients',
          'areasOfInterest',
          'successMessage'
        ]
      }
    }
  },
  methods(self) {
    return {
      // The Contact group as the contact form service and widget consume it:
      // `{ recipients: string[], areas, successMessage }`. The recipients stay
      // on the server (reference/spec/03-backend.md §4, Q-10).
      async getContactSettings(req) {
        const global = req.data.global || await self.findGlobal(req);
        return contactSettings(global);
      }
    };
  }
};
