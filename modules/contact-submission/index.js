// Contact form submissions — reference/spec/03-backend.md §5
// `contact-submission`. A record of what a visitor sent, not editorial content:
// `localized: false` keeps it out of the draft/publish workflow, and
// `showCreate`/`quickCreate` keep anyone from typing one by hand. The
// `contact-form` service inserts them with an elevated request (§7).
export default {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'Contact Submission',
    pluralLabel: 'Contact Submissions',
    alias: 'contactSubmission',
    // Form data has no draft and no published copy. Apostrophe also forces
    // `autopublish: false` for a type that is not localized.
    localized: false,
    // Submissions are created by the contact form, never in the admin.
    showCreate: false,
    quickCreate: false,
    // Admins and editors can read and list submissions; contributors, guests
    // and the public cannot (reference/spec/03-backend.md §5).
    viewRole: 'editor',
    editRole: 'editor',
    // The name and email are personal data: keep them out of the site search
    // index. There is no `publicApiProjection`, so there is no anonymous REST
    // access at all.
    searchable: false
  },
  columns: {
    add: {
      status: {
        label: 'Status'
      }
    }
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Title',
        // Set from the name and area of interest on every save (see `convert`),
        // so it is shown but not typed by an editor.
        help: 'Generated from the full name and the area of interest.',
        readOnly: true
      },
      status: {
        type: 'select',
        label: 'Status',
        help: 'New until an editor has followed up. This is the only field an editor can change.',
        choices: [
          {
            label: 'New',
            value: 'new'
          },
          {
            label: 'Handled',
            value: 'handled'
          }
        ],
        def: 'new',
        required: true
      },
      fullName: {
        type: 'string',
        label: 'Full name',
        help: 'The name the visitor typed in the contact form.',
        required: true,
        max: 120
      },
      email: {
        type: 'email',
        label: 'Email',
        help: 'The address the visitor typed in the contact form.',
        required: true
      },
      areaOfInterest: {
        type: 'string',
        label: 'Area of interest',
        // Q-10: the options are the Global `areasOfInterest` values (Option A /
        // B / C in the seed); the contact form service rejects anything else.
        help: 'One of the values in Global → Contact → Areas of interest (Q-10).',
        required: true,
        max: 120
      },
      emailSent: {
        type: 'boolean',
        label: 'Notification email sent',
        help: 'Set by the contact form service after it emails the recipients (reference/spec/03-backend.md §7).',
        def: false
      },
      meta: {
        type: 'object',
        label: 'Submission metadata',
        // Captured by the service, never typed. The IP is stored only as a
        // salted SHA-256 hash (reference/spec/03-backend.md §5).
        help: 'Captured by the contact form service. Read-only.',
        readOnly: true,
        fields: {
          add: {
            ipHash: {
              type: 'string',
              label: 'IP hash',
              help: 'Salted SHA-256 of the submitter IP; the raw address is never stored.',
              readOnly: true
            },
            userAgent: {
              type: 'string',
              label: 'User agent',
              help: 'Browser string the visitor sent, for support follow-up.',
              textarea: true,
              readOnly: true
            },
            referer: {
              type: 'string',
              label: 'Referer',
              help: 'Page the form was submitted from, when the browser sent one.',
              readOnly: true
            }
          }
        }
      }
    },
    group: {
      submission: {
        label: 'Submission',
        fields: [
          'status',
          'fullName',
          'email',
          'areaOfInterest',
          'emailSent',
          'meta',
          'title'
        ]
      }
    }
  },
  methods(self) {
    return {
      // Core answers a request it cannot serve with `notfound` (404) because
      // the type has no `publicApiProjection`. Submissions are private, so say
      // `forbidden` (403) instead — including for contributors, who pass core's
      // `view-draft` API gate but not this type's `viewRole`.
      publicApiCheck(req) {
        if (!self.apos.permission.can(req, 'view', self.name)) {
          throw self.apos.error('forbidden');
        }
      }
    };
  },
  extendMethods(self) {
    return {
      // The submission is evidence of what the visitor sent: only `status`
      // changes after it is stored. Admins keep Apostrophe's usual full access;
      // for every other role the remaining fields are read-only, so `convert`
      // leaves the stored values alone whatever the request carries.
      allowedSchema(_super, req, ...args) {
        const schema = _super(req, ...args);
        if (req.user?.role === 'admin') {
          return schema;
        }
        return schema.map((field) => field.name === 'status'
          ? field
          : {
            ...field,
            readOnly: true
          });
      },
      async convert(_super, req, input, doc, options) {
        await _super(req, input, doc, options);
        // A select field blanks out when the input omits it; a record that has
        // never been handled is `new`.
        if (doc.status == null) {
          doc.status = 'new';
        }
        // `title` is read-only in the schema, so it is never taken from input;
        // derive it here, after the fields it is built from are converted.
        doc.title = `${doc.fullName} – ${doc.areaOfInterest}`;
      }
    };
  }
};
