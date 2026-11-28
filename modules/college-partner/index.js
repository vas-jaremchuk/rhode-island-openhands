// College partners whose logos the education section shows —
// reference/spec/03-backend.md §5 `college-partner`. The site is one page, so
// the type has no piece page: the logos live in the education widget's
// `_partners` relationship, whose order is the display order (editors drag to
// reorder). Seed content: modules/site/seed/partners.js.
export default {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'College Partner',
    pluralLabel: 'College Partners',
    alias: 'collegePartner'
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Title',
        // The partner name is the logo's alt text; it must not carry a "logo"
        // suffix (issue #9, "Alt text is the partner name").
        help: 'Partner name, for example "Brown University". Also used as the logo alt text.',
        required: true,
        sortify: true
      },
      _logo: {
        type: 'relationship',
        label: 'Logo',
        help: 'The partner logo from the media library. Required.',
        withType: '@apostrophecms/image',
        max: 1,
        required: true
      },
      url: {
        type: 'url',
        label: 'URL',
        // Q-11: every link defaults to the Organogenesis site; a partner without
        // a URL shows a plain, unlinked logo.
        help: 'Optional. When set, the logo links here. The seed uses the Organogenesis site (Q-11).'
      }
    },
    group: {
      basics: {
        label: 'Partner',
        fields: [
          'title',
          '_logo',
          'url'
        ]
      }
    }
  },
  extendMethods(self) {
    return {
      async convert(_super, req, input, doc, options) {
        await _super(req, input, doc, options);
        // Schema `required` is not enforced server-side for relationship fields
        // (`relationship.convert` in @apostrophecms/schema), so the logo needs an
        // explicit check. Run it on the converted document so an id that does
        // not resolve also fails.
        if (!doc._logo?.length) {
          const error = self.apos.error('required', 'The logo is required.');
          error.path = '_logo';
          throw [ error ];
        }
        return doc;
      }
    };
  }
};
