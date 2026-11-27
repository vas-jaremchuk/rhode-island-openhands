// Site-wide settings for the header and the document head —
// reference/spec/03-backend.md §4 (Header and SEO groups). The layout reads
// them as `data.global`; `site:seed` fills the defaults (modules/site/seed/global.js).
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
      }
    }
  }
};
