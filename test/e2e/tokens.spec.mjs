/* global getComputedStyle */
// The design-token foundation: tokens reach the document element, the type
// utilities render at the two design widths, the layout primitives use the
// §Layout numbers, and every font loads from this site's origin.
import { expect, test } from '@playwright/test';

// The two widths the designs exist at (reference/spec/02-design-system.md
// §Layout); `playwright.config.js` runs the suite at each of them.
const MOBILE = 375;
const DESKTOP = 1440;

function token(page, name) {
  return page.evaluate(
    (property) => getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim(),
    name
  );
}

// The utilities belong to section widgets that land in later Tasks, so this
// measures them on an element added to the rendered document: the stylesheet
// under test is the one the page already loaded.
function measure(page, className, tag) {
  return page.evaluate(({ className, tag }) => {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = 'Aa';
    document.body.append(element);
    const style = getComputedStyle(element);
    const { width } = element.getBoundingClientRect();
    const measured = {
      width,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      paddingTop: style.paddingTop,
      paddingLeft: style.paddingLeft
    };
    element.remove();
    return measured;
  }, {
    className,
    tag
  });
}

test.describe('design tokens', () => {
  test('exposes the colour tokens on the document element', async ({ page }) => {
    await page.goto('/');
    expect((await token(page, '--c-blue')).toLowerCase()).toBe('#002855');
    expect((await token(page, '--c-yellow')).toLowerCase()).toBe('#ffcd03');
  });

  test('renders t-title-xl at the design size for the viewport', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize().width;
    expect([ MOBILE, DESKTOP ]).toContain(width);

    const title = await measure(page, 't-title-xl', 'h2');
    expect(title.fontFamily.startsWith('"Roboto Condensed"')).toBe(true);
    expect(title.fontWeight).toBe('700');

    if (width >= DESKTOP) {
      expect(title.fontSize).toBe('62px');
      expect(title.lineHeight).toBe('62px');
    } else {
      expect(title.fontSize).toBe('38px');
      expect(title.lineHeight).toBe('46px');
    }
  });

  test('renders t-lead and t-card-title from the type scale', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize().width;
    expect([ MOBILE, DESKTOP ]).toContain(width);

    const lead = await measure(page, 't-lead', 'p');
    const cardTitle = await measure(page, 't-card-title', 'h3');

    if (width <= MOBILE) {
      expect(lead.fontSize).toBe('22px');
      expect(lead.lineHeight).toBe('32px');
    }
    expect(lead.fontFamily.startsWith('Roboto')).toBe(true);
    expect(cardTitle.fontFamily.startsWith('"Libre Franklin"')).toBe(true);
    expect(cardTitle.fontWeight).toBe('700');
  });

  test('sizes .container, .container--wide and .section from §Layout', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize().width;
    expect([ MOBILE, DESKTOP ]).toContain(width);

    const container = await measure(page, 'container', 'div');
    const wide = await measure(page, 'container--wide', 'div');
    const section = await measure(page, 'section', 'div');

    if (width >= DESKTOP) {
      expect(container.width).toBe(1100);
      expect(wide.width).toBe(1326);
      expect(section.paddingTop).toBe('90px');
    } else {
      // 100% − 2 × 14 px of gutter.
      expect(container.width).toBe(375);
      expect(container.paddingLeft).toBe('14px');
      expect(section.paddingTop).toBe('60px');
    }
  });

  test('loads every font from this site, never a third-party host', async ({ page }) => {
    const fontRequests = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'font' || /\.woff2?(\?|$)/.test(request.url())) {
        fontRequests.push(request.url());
      }
    });

    await page.goto('/');

    // Add each family to the document so the browser has to fetch all three.
    await measure(page, 't-title-xl', 'h2');
    await measure(page, 't-card-title', 'h3');
    await measure(page, 't-body', 'p');
    await page.waitForLoadState('networkidle');

    expect(fontRequests.length).toBeGreaterThan(0);
    const origin = new URL(page.url()).origin;
    for (const url of fontRequests) {
      expect(new URL(url).origin, `${url} must be served from ${origin}`).toBe(origin);
    }

    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [ 'Roboto', 'Roboto Condensed', 'Libre Franklin' ]
        .filter((family) => document.fonts.check(`700 20px "${family}"`));
    });
    expect(loaded).toEqual([ 'Roboto', 'Roboto Condensed', 'Libre Franklin' ]);
  });
});
