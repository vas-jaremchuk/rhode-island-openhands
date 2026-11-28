// Global Contact group — Task 11. `contactRecipients`, `areasOfInterest` and
// `successMessage` (reference/spec/03-backend.md §4) with their seed (Q-10) and
// the server-only `getContactSettings` API the contact form consumes.
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import { startApos, testDbPath } from './helpers.mjs';

const DEFAULT_RECIPIENT = 'vasj@sparkdsg.com';
const DEFAULT_SUCCESS_MESSAGE = 'Thank you. We will be in touch.';
const DEFAULT_AREAS = [
  {
    label: 'Option A',
    value: 'option-a'
  },
  {
    label: 'Option B',
    value: 'option-b'
  },
  {
    label: 'Option C',
    value: 'option-c'
  }
];

describe('global contact settings', function () {
  this.timeout(180000);

  const db = testDbPath();
  let site;
  let savedContactTo;

  const globalModule = () => site.apos.modules['@apostrophecms/global'];
  const publishedReq = () => site.apos.task.getReq({ mode: 'published' });
  const findGlobal = () => globalModule().findGlobal(publishedReq());
  const field = (schema, name) => schema.find((candidate) => candidate.name === name);

  async function updateGlobal(changes) {
    const global = await findGlobal();
    return globalModule().update(publishedReq(), {
      ...global,
      ...changes
    });
  }

  before(async () => {
    savedContactTo = process.env.CONTACT_TO;
    delete process.env.CONTACT_TO;
    site = await startApos({ db });
    await site.apos.task.invoke('site:seed');
  });

  after(async () => {
    if (savedContactTo === undefined) {
      delete process.env.CONTACT_TO;
    } else {
      process.env.CONTACT_TO = savedContactTo;
    }
    await site.stop();
  });

  describe('Global schema', () => {
    it('has the Contact group with labelled fields and help text', () => {
      const { schema } = globalModule();

      const recipients = field(schema, 'contactRecipients');
      assert.equal(recipients.type, 'string');
      assert.equal(recipients.group.label, 'Contact');
      assert.ok(recipients.label, 'contactRecipients has a label');
      assert.ok(recipients.help, 'contactRecipients has help text');

      const areas = field(schema, 'areasOfInterest');
      assert.equal(areas.type, 'array');
      assert.equal(areas.group.label, 'Contact');
      assert.equal(areas.titleField, 'label');
      assert.deepEqual(areas.schema.map(({ name }) => name), [ 'label', 'value' ]);
      for (const subField of areas.schema) {
        assert.equal(subField.type, 'string');
        assert.equal(subField.required, true);
        assert.ok(subField.label, `areasOfInterest.${subField.name} has a label`);
        assert.ok(subField.help, `areasOfInterest.${subField.name} has help text`);
      }

      const success = field(schema, 'successMessage');
      assert.equal(success.type, 'string');
      assert.equal(success.group.label, 'Contact');
      assert.ok(success.label, 'successMessage has a label');
      assert.ok(success.help, 'successMessage has help text');
    });

    it('puts the three fields in the Contact tab in order', () => {
      assert.deepEqual(
        globalModule().schema
          .filter(({ group }) => group.label === 'Contact')
          .map(({ name }) => name),
        [ 'contactRecipients', 'areasOfInterest', 'successMessage' ]
      );
    });
  });

  describe('seed', () => {
    it('fills the recipients, the three areas and the success message', async () => {
      const global = await findGlobal();

      assert.equal(global.contactRecipients, DEFAULT_RECIPIENT);
      assert.deepEqual(
        global.areasOfInterest.map(({
          label, value
        }) => ({
          label,
          value
        })),
        DEFAULT_AREAS
      );
      assert.equal(global.successMessage, DEFAULT_SUCCESS_MESSAGE);
    });

    it('does not duplicate the areas when it runs a second time', async () => {
      await site.apos.task.invoke('site:seed');
      const global = await findGlobal();
      assert.equal(global.areasOfInterest.length, 3);
    });
  });

  describe('getContactSettings', () => {
    it('exposes the seeded Contact group on the server', async () => {
      const settings = await globalModule().getContactSettings(publishedReq());
      assert.deepEqual(settings, {
        recipients: [ DEFAULT_RECIPIENT ],
        areas: DEFAULT_AREAS,
        successMessage: DEFAULT_SUCCESS_MESSAGE
      });
    });

    it('splits and trims a comma-separated recipient list', async () => {
      await updateGlobal({
        contactRecipients: 'a@x.com, b@y.com'
      });

      const { recipients } = await globalModule().getContactSettings(publishedReq());
      assert.deepEqual(recipients, [ 'a@x.com', 'b@y.com' ]);
    });

    it('falls back to CONTACT_TO when the field is empty', async () => {
      await updateGlobal({
        contactRecipients: ''
      });
      process.env.CONTACT_TO = 'c@z.com';
      try {
        const { recipients } = await globalModule().getContactSettings(publishedReq());
        assert.deepEqual(recipients, [ 'c@z.com' ]);
      } finally {
        delete process.env.CONTACT_TO;
      }
    });

    it('returns no recipients when neither the field nor CONTACT_TO is set', async () => {
      await updateGlobal({
        contactRecipients: ''
      });
      const { recipients } = await globalModule().getContactSettings(publishedReq());
      assert.deepEqual(recipients, []);
    });

    it('returns the edited success message', async () => {
      await updateGlobal({
        successMessage: 'Merci. Nous vous contacterons.'
      });
      const { successMessage } = await globalModule().getContactSettings(publishedReq());
      assert.equal(successMessage, 'Merci. Nous vous contacterons.');
    });
  });

  describe('anonymous visitors', () => {
    it('never receive a recipient address in the page HTML', async () => {
      await updateGlobal({
        contactRecipients: DEFAULT_RECIPIENT
      });
      const response = await fetch(`${site.url}/`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(!html.includes(DEFAULT_RECIPIENT), 'the default recipient is not in the HTML');
      assert.ok(!html.includes('contactRecipients'), 'the recipient field is not in the HTML');
    });

    it('cannot read the Global document through the REST API', async () => {
      const response = await fetch(`${site.url}/api/v1/@apostrophecms/global`);
      assert.notEqual(response.status, 200);
      const body = await response.text();
      assert.ok(!body.includes(DEFAULT_RECIPIENT), 'the response has no recipient');
    });
  });
});
