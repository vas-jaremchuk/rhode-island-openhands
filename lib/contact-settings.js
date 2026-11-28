// Defaults and parsing for the Global Contact group
// (reference/spec/03-backend.md §4, Q-10). The recipient list is server-side
// only: `getContactSettings` is never put in page data or a public projection.

export const DEFAULT_CONTACT_RECIPIENTS = 'vasj@sparkdsg.com';

export const DEFAULT_AREAS_OF_INTEREST = [
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

export const DEFAULT_SUCCESS_MESSAGE = 'Thank you. We will be in touch.';

// Splits the comma-separated Global field (or `CONTACT_TO`) into addresses,
// trimming whitespace and dropping empty entries.
export function parseRecipients(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

// `{ recipients, areas, successMessage }` for the contact form service and the
// contact widget. A configured recipient list wins over `CONTACT_TO` (Q-10);
// the success message falls back to the Figma-era default.
export function contactSettings(global, env = process.env) {
  const configured = parseRecipients(global?.contactRecipients);
  return {
    recipients: configured.length
      ? configured
      : parseRecipients(env.CONTACT_TO),
    areas: (global?.areasOfInterest || []).map(({ label, value }) => ({
      label,
      value
    })),
    successMessage: global?.successMessage || DEFAULT_SUCCESS_MESSAGE
  };
}
