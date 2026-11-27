/* global getComputedStyle */
// Site layout — the acceptance criteria of Task 06 at the two design widths
// (`desktop` 1440 and `mobile` 375 in playwright.config.js): the header over
// the first section, the empty footer and an axe-clean header and footer.
import { expect, test } from '@playwright/test';
import { checkA11y } from './helpers.mjs';

// §Layout: the `lg` breakpoint, where the desktop header starts.
const DESKTOP = 1200;

async function box(locator) {
  const rect = await locator.boundingBox();
  return {
    top: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function background(locator) {
  return locator.evaluate((el) => getComputedStyle(el).backgroundColor);
}

test.describe('site layout', () => {
  test('renders the header and footer from the design at this width', async ({ page }) => {
    await page.goto('/');
    const width = page.viewportSize().width;
    const header = page.locator('header.c-header');
    const bar = page.locator('.c-header__bar');
    const logo = page.locator('.c-header__logo img');
    const footer = page.locator('footer.c-footer');

    // Node map row 10 / Q-6: full width, --c-footer, 354 px from 768 and 270 below.
    expect(await background(footer)).toBe('rgb(4, 28, 44)');
    expect(await box(footer)).toMatchObject({
      width,
      height: width >= 768 ? 354 : 270
    });

    if (width >= DESKTOP) {
      // Node map row 1: the 65 px utility row over the 92 px --c-header logo bar.
      expect(await box(header)).toMatchObject({
        top: 0,
        height: 157
      });
      expect(await box(page.locator('.c-header__utility'))).toMatchObject({ height: 65 });
      expect(await box(bar)).toMatchObject({ height: 92 });
      expect(await background(bar)).toBe('rgb(71, 86, 110)');
      expect(await box(logo)).toMatchObject({
        width: 252,
        height: 22
      });

      const links = page.locator('.c-header__utility a');
      await expect(links).toHaveCount(3);
      expect(await links.allTextContents()).toEqual([
        'OUR STORY',
        'INVESTORS & MEDIA',
        'CONTACT US'
      ]);

      // §Components `button--outline-white`: 116 × 32 with a 1 px white border.
      const contact = links.last();
      expect(await box(contact)).toMatchObject({
        width: 116,
        height: 32
      });
      expect(await contact.evaluate((el) => {
        const style = getComputedStyle(el);
        return `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
      })).toBe('1px solid rgb(255, 255, 255)');

      // The header overlays the first section rather than pushing it down.
      expect(await box(page.locator('main'))).toMatchObject({ top: 0 });
    } else {
      // Q-5: the mobile bar is 50 px with the wordmark only.
      expect(await box(header)).toMatchObject({
        top: 0,
        width,
        height: 50
      });
      expect(await box(logo)).toMatchObject({
        width: 126,
        height: 11
      });
      await expect(page.locator('.c-header__utility')).toBeHidden();

      // No menu: the links are still in the document but cannot take focus.
      const focusable = await page.evaluate(() => {
        const link = document.querySelector('.c-header__utility a');
        link.focus();
        return document.activeElement === link;
      });
      expect(focusable).toBe(false);
      expect(await box(page.locator('main'))).toMatchObject({ top: 50 });
    }
  });

  test('has no serious or critical axe violations in the header or footer', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, 'header');
    await checkA11y(page, 'footer');
  });
});
