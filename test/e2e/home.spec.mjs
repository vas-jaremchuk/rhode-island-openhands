// Browser foundation. Until the section Tasks land, the only page is the
// starter's home page; these tests prove the harness itself: a page answers 200,
// logs no console errors and passes axe at 1440 and 375 (the two Playwright
// projects in `playwright.config.js`).
import { expect, test } from '@playwright/test';
import { checkA11y, section } from './helpers.mjs';

test.describe('home page', () => {
  test('answers 200 and logs no console errors', async ({ page }) => {
    // System Chromium fetches /favicon.ico on its own and the project has no
    // icon (none in `reference/` or `fixtures/`), so that one request is
    // ignored. Every other console error, page error and 4xx/5xx response the
    // page causes fails the test.
    const isFavicon = (url) => url.endsWith('/favicon.ico');
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !isFavicon(message.location().url)) {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400 && !isFavicon(response.url())) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });

    const response = await page.goto('/');
    expect(response.status()).toBe(200);
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });

  // The starter's welcome content is left in scope: axe reports only a
  // `heading-order` (moderate) violation there, and the gate is serious and
  // critical (reference/spec/04-frontend.md §Accessibility).
  test('has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page);
  });
});

// The helper's own check, so a broken axe gate cannot pass silently.
test.describe('checkA11y', () => {
  test('fails with the axe rule id for an image without alt', async ({ page }) => {
    await page.setContent('<!doctype html><html lang="en"><body><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></body></html>');
    await expect(checkA11y(page)).rejects.toThrow(/image-alt/);
  });

  test('locates a section by its name', async ({ page }) => {
    await page.setContent('<!doctype html><html lang="en"><body><section class="s-hero">Hero</section><section class="s-impact">Impact</section></body></html>');
    await expect(section(page, 'hero')).toHaveText('Hero');
    await expect(section(page, 'impact')).toHaveCount(1);
  });
});
