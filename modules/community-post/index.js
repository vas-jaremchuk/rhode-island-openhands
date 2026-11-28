// Community (LinkedIn) posts — reference/spec/03-backend.md §5
// `community-post`. The community section lists them newest first; the site is
// one page, so the type has no piece page. Seed content:
// modules/site/seed/community.js.
import { relativeDate } from '../../lib/relative-date.js';

export default {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'Community Post',
    pluralLabel: 'Community Posts',
    alias: 'communityPost',
    quickCreate: true,
    // Newest first for the community section and for `find()`
    // (reference/spec/03-backend.md §5).
    sort: {
      postedAt: -1
    }
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Title',
        help: 'Post headline, for example "New Biomanufacturing Facility Opened In Smithfield, RI".',
        required: true,
        max: 160,
        sortify: true
      },
      excerpt: {
        type: 'string',
        label: 'Excerpt',
        help: 'Plain-text summary under the title. The card clamps it to three lines.',
        textarea: true,
        required: true,
        max: 240
      },
      _image: {
        type: 'relationship',
        label: 'Image',
        help: 'Photo on the post card. Required.',
        withType: '@apostrophecms/image',
        max: 1,
        required: true
      },
      postedAt: {
        type: 'date',
        label: 'Posted at',
        help: 'Shown as relative time, for example "6d", "3w" or "Mar 4".',
        required: true
      },
      source: {
        type: 'select',
        label: 'Source',
        help: 'The network shown beside the posted date. LinkedIn is the default.',
        choices: [
          {
            label: 'LinkedIn',
            value: 'linkedin'
          },
          {
            label: 'Other',
            value: 'other'
          }
        ],
        def: 'linkedin'
      },
      authorName: {
        type: 'string',
        label: 'Author name',
        help: 'Name above the posted date on the card.',
        def: 'Organogenesis'
      },
      _avatar: {
        type: 'relationship',
        label: 'Avatar',
        help: 'Optional. Falls back to the Global default avatar.',
        withType: '@apostrophecms/image',
        max: 1
      },
      url: {
        type: 'url',
        label: 'URL',
        // Q-11: every post link defaults to the Organogenesis site.
        help: 'Link to the original post. Defaults to the Organogenesis site (Q-11).',
        required: true
      }
    },
    group: {
      basics: {
        label: 'Post',
        fields: [
          'title',
          'excerpt',
          '_image',
          'postedAt',
          'source',
          'authorName',
          '_avatar',
          'url'
        ]
      }
    }
  },
  // Templates format `postedAt` at render time with `relativeDate`
  // (reference/spec/03-backend.md §5). A module helper makes the same function
  // available to Nunjucks and JSX as `helpers.communityPost.relativeDate`.
  helpers(self) {
    return {
      relativeDate
    };
  },
  extendMethods(self) {
    return {
      async convert(_super, req, input, doc, options) {
        // A `max` on a string field truncates silently
        // (`checkStringLength` in @apostrophecms/schema). The excerpt limit is a
        // rule, so check the raw input and fail the save with a field error.
        if (typeof input.excerpt === 'string' && input.excerpt.length > 240) {
          const error = self.apos.error('invalid', 'The excerpt must be 240 characters or fewer.');
          error.path = 'excerpt';
          throw [ error ];
        }
        await _super(req, input, doc, options);
        // Schema `required` is not enforced server-side for relationship fields
        // (`relationship.convert` in @apostrophecms/schema), so the card image
        // needs an explicit check. Run it on the converted document so an id
        // that does not resolve also fails.
        if (!doc._image?.length) {
          const error = self.apos.error('required', 'The image is required.');
          error.path = '_image';
          throw [ error ];
        }
        return doc;
      }
    };
  }
};
