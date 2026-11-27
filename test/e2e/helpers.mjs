// Shared assertions for the browser tests. Section Tasks use these instead of
// writing axe or locator plumbing of their own.
import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

// WCAG 2.2 AA gate from `reference/spec/04-frontend.md` §Accessibility: axe must
// report zero serious or critical violations.
const BLOCKING_IMPACTS = [ 'serious', 'critical' ];

// Runs axe on the whole page, or inside `selector` when a section is given, and
// fails with the axe rule id in the message (`image-alt`, `color-contrast`, …).
export async function checkA11y(page, selector) {
  const builder = new AxeBuilder({ page });
  if (selector) {
    builder.include(selector);
  }
  const { violations } = await builder.analyze();
  const report = violations
    .filter(({ impact }) => BLOCKING_IMPACTS.includes(impact))
    .map(({
      id, impact, help, nodes
    }) => {
      const targets = nodes.map((node) => node.target.join(' ')).join(', ');
      return `${id} (${impact}): ${help} [${targets}]`;
    });
  expect(report, 'axe reported serious or critical violations').toEqual([]);
}

// Section widgets render one `<section class="s-<name>">` each (AGENTS.md), so
// tests locate them by the name the Task's section is called by.
export function section(page, name) {
  return page.locator(`section.s-${name}`);
}
