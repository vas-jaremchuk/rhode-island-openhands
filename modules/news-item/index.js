// News & Events pieces — reference/spec/03-backend.md §5 `news-item`. The news
// section lists them newest first; the site is one page, so the type has no
// piece page. Seed content: modules/site/seed/news.js.
export default {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'News Item',
    pluralLabel: 'News Items',
    alias: 'newsItem',
    quickCreate: true,
    // Newest first for the news section and for `find()`
    // (reference/spec/03-backend.md §5).
    sort: {
      date: -1
    }
  },
  // The admin list shows Title, Kind and Date first (reference/spec/03-backend.md
  // §5); Apostrophe's own Status and Last Edited columns follow.
  columns: {
    add: {
      kind: {
        label: 'Kind'
      },
      date: {
        label: 'Date'
      }
    },
    order: [
      'title',
      'kind',
      'date'
    ]
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Title',
        help: 'Headline on the news card, for example "Organogenesis Unveils Plans for New Biomanufacturing Facility in Smithfield, RI".',
        required: true,
        max: 120,
        sortify: true
      },
      kind: {
        type: 'select',
        label: 'Kind',
        help: 'News shows the newspaper icon; event shows the calendar icon.',
        required: true,
        choices: [
          {
            label: 'News',
            value: 'news'
          },
          {
            label: 'Event',
            value: 'event'
          }
        ]
      },
      date: {
        type: 'date',
        label: 'Date',
        help: 'Shown on the card as "December 18, 2025".',
        required: true
      },
      excerpt: {
        type: 'string',
        label: 'Excerpt',
        help: 'Plain-text summary under the title. The card clamps it to three lines.',
        textarea: true,
        required: true,
        max: 200
      },
      link: {
        type: 'url',
        label: 'Link',
        // Q-11: every READ MORE link defaults to the Organogenesis site.
        help: 'Where READ MORE goes. Defaults to the Organogenesis newsroom (Q-11).',
        required: true
      },
      newTab: {
        type: 'boolean',
        label: 'Open in a new tab',
        help: 'Open the linked article in a new browser tab.',
        def: false
      }
    },
    group: {
      basics: {
        label: 'Basics',
        fields: [
          'title',
          'kind',
          'date',
          'excerpt',
          'link',
          'newTab'
        ]
      }
    }
  },
  extendMethods(self) {
    return {
      // A `max` on a string field truncates silently
      // (`checkStringLength` in @apostrophecms/schema). The excerpt limit is a
      // rule, so check the raw input and fail the save with a field error.
      async convert(_super, req, input, doc, options) {
        if (typeof input.excerpt === 'string' && input.excerpt.length > 200) {
          const error = self.apos.error('invalid', 'The excerpt must be 200 characters or fewer.');
          error.path = 'excerpt';
          throw [ error ];
        }
        return _super(req, input, doc, options);
      }
    };
  }
};
