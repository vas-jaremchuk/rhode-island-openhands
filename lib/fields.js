// Shared field presets — reference/spec/03-backend.md §2.
//
// Every section widget spreads these into `fields.add`, so an editor sees the
// same heading, call-to-action, video and lead controls everywhere. Field
// names are the public contract: templates read `widget.title`,
// `widget.cta.label`, `widget.video.media`, `widget.lead` and so on.

// `eyebrow` + `title` rendered by the shared `SectionHeading` component
// (`views/components/ui.jsx`). `align` is the default of the alignment field;
// the design uses centred headings in most sections and left in Community.
export function sectionHeading({ align = 'center' } = {}) {
  return {
    eyebrow: {
      type: 'string',
      label: 'Eyebrow',
      help: 'Short line above the title, for example "About our".',
      max: 40
    },
    title: {
      type: 'string',
      label: 'Title',
      required: true,
      max: 80
    },
    headingLevel: {
      type: 'select',
      label: 'Heading level',
      help: 'Use H2 for a section title and H3 only inside another section.',
      choices: [
        {
          label: 'H2',
          value: 'h2'
        },
        {
          label: 'H3',
          value: 'h3'
        }
      ],
      def: 'h2'
    },
    align: {
      type: 'select',
      label: 'Alignment',
      choices: [
        {
          label: 'Centre',
          value: 'center'
        },
        {
          label: 'Left',
          value: 'left'
        }
      ],
      def: align
    }
  };
}

// A button or link. `Button` renders nothing when `label` or `url` is empty
// (reference/spec/03-backend.md §2).
export function cta() {
  return {
    cta: {
      type: 'object',
      label: 'Call to action',
      fields: {
        add: {
          label: {
            type: 'string',
            label: 'Label'
          },
          url: {
            type: 'url',
            label: 'URL'
          },
          newTab: {
            type: 'boolean',
            label: 'Open in a new tab',
            def: false
          },
          showArrow: {
            type: 'boolean',
            label: 'Show arrow',
            def: true
          }
        }
      }
    }
  };
}

// Video URL plus the poster the player shows until a visitor clicks
// (reference/spec/04-frontend.md §JavaScript, `video-embed.js`). `title` is the
// play button's accessible name and the iframe's `title`.
export function video() {
  return {
    video: {
      type: 'object',
      label: 'Video',
      fields: {
        add: {
          media: {
            type: 'oembed',
            label: 'Video URL',
            oembedType: 'video',
            required: true
          },
          _poster: {
            type: 'relationship',
            label: 'Poster image',
            withType: '@apostrophecms/image',
            max: 1,
            required: true
          },
          title: {
            type: 'string',
            label: 'Video title',
            help: 'Read out by screen readers on the play button and the player.',
            required: true
          }
        }
      }
    }
  };
}

// Plain multi-line text. The design's leads have no rich-text features
// (reference/spec/03-backend.md §2).
export function lead() {
  return {
    lead: {
      type: 'string',
      label: 'Lead',
      textarea: true,
      max: 400
    }
  };
}
