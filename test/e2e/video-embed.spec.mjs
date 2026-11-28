/* global document, window */
// Click-to-play video — the acceptance criteria of Task 12 at the two design
// widths (`desktop` 1440 and `mobile` 375 in playwright.config.js).
//
// No section widget renders `VideoEmbed` yet (they land in later Tasks), so the
// markup comes from the component's contract and the player module under test
// is imported from source. The page itself supplies the real stylesheet.
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const PLAYER = new URL('../../modules/asset/ui/src/js/video-embed.js', import.meta.url);
const VIDEO_URL = 'https://www.youtube.com/watch?v=YqP8s2M4xig';
const DESKTOP = 1200;

// Every host the acceptance criterion names, plus `player.vimeo.com`.
const THIRD_PARTY = /^https:\/\/(?:[a-z0-9-]+\.)*(?:youtube\.com|youtube-nocookie\.com|ytimg\.com|vimeo\.com)\//i;

const POSTER = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

// Mirrors the `VideoEmbed` server component: poster, 40% overlay (CSS) and a
// button named after the title. The player reads the URL and title from the
// element's data attributes.
function embed({
  url = VIDEO_URL, title = 'Tour our facility'
} = {}) {
  return `<div class="c-video-embed" data-video-embed data-video-url="${url}" data-video-title="${title}">
  <img class="c-picture" src="${POSTER}" width="1100" height="619" alt="A technician in a cleanroom">
  <button class="c-video-embed__play" type="button" aria-label="Play video: ${title}">
    <svg class="c-video-embed__icon" viewBox="0 0 72 72" fill="none" aria-hidden="true" focusable="false">
      <circle cx="36" cy="36" r="34.8615" stroke="currentColor" stroke-width="2.27702"></circle>
      <path d="M47.0312 35.7097L30.0474 45.5153L30.0474 25.904L47.0312 35.7097Z" fill="currentColor"></path>
    </svg>
  </button>
</div>`;
}

// Runs the real module in the page, exposes it for a second call and enhances
// freshly added markup.
async function install(page, markup, { twice = false } = {}) {
  const source = await readFile(PLAYER, 'utf8');
  await page.evaluate(async ({
    source, markup, twice
  }) => {
    const blobUrl = URL.createObjectURL(new Blob([ source ], { type: 'text/javascript' }));
    const module = await import(blobUrl);
    URL.revokeObjectURL(blobUrl);
    window.initVideoEmbed = module.initVideoEmbed;

    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = markup;
    document.body.append(container);

    const element = container.querySelector('[data-video-embed]');
    module.initVideoEmbed(element);
    if (twice) {
      // Two widget players can both target `[data-video-embed]`.
      module.initVideoEmbed(element);
    }
  }, {
    source,
    markup,
    twice
  });
}

// Answers third-party player requests locally and records them, so a test can
// prove none happened before the click without touching the network.
async function watchThirdParty(page) {
  const requests = [];
  await page.route(THIRD_PARTY, (route) => {
    requests.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>player</title>'
    });
  });
  return requests;
}

test.describe('video embed', () => {
  test('loads no YouTube or Vimeo request until the play button is activated', async ({ page }) => {
    const requests = await watchThirdParty(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await install(page, embed());

    expect(requests).toEqual([]);
    await expect(page.locator('[data-video-embed] iframe')).toHaveCount(0);

    await page.locator('.c-video-embed__play').click();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await expect(page.locator('[data-video-embed] iframe')).toHaveCount(1);
  });

  test('removes the button and starts a no-cookie YouTube iframe on Enter', async ({ page }) => {
    const requests = await watchThirdParty(page);
    await page.goto('/');
    await install(page, embed());

    await page.locator('.c-video-embed__play').focus();
    await page.keyboard.press('Enter');

    const iframe = page.locator('[data-video-embed] iframe');
    await expect(iframe).toHaveCount(1);
    await expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/YqP8s2M4xig?autoplay=1&rel=0'
    );
    await expect(iframe).toHaveAttribute('title', 'Tour our facility');
    await expect(iframe).toHaveAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    await expect(page.locator('.c-video-embed__play')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');
    await expect.poll(() => requests.length).toBe(1);
  });

  test('builds a Vimeo player from a vimeo.com URL', async ({ page }) => {
    await watchThirdParty(page);
    await page.goto('/');
    await install(page, embed({ url: 'https://vimeo.com/123456789' }));

    await page.locator('.c-video-embed__play').click();
    await expect(page.locator('[data-video-embed] iframe')).toHaveAttribute(
      'src',
      'https://player.vimeo.com/video/123456789?autoplay=1&dnt=1'
    );
  });

  test('builds a YouTube player from a youtu.be URL', async ({ page }) => {
    await watchThirdParty(page);
    await page.goto('/');
    await install(page, embed({ url: 'https://youtu.be/YqP8s2M4xig' }));

    await page.locator('.c-video-embed__play').click();
    await expect(page.locator('[data-video-embed] iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/YqP8s2M4xig?autoplay=1&rel=0'
    );
  });

  test('creates one iframe when initialised twice', async ({ page }) => {
    await watchThirdParty(page);
    await page.goto('/');
    await install(page, embed(), { twice: true });

    await page.locator('.c-video-embed__play').click();
    await expect(page.locator('[data-video-embed] iframe')).toHaveCount(1);
  });

  test('falls back to a link when the provider is unknown', async ({ page }) => {
    await page.goto('/');
    await install(page, embed({ url: 'https://example.com/videos/1' }));

    const link = page.locator('.c-video-embed__play');
    await expect(link).toHaveAttribute('href', 'https://example.com/videos/1');
    await expect(page.locator('[data-video-embed] button')).toHaveCount(0);
  });

  test('sizes the poster 16:9 and centres the play button', async ({ page }) => {
    await page.goto('/');
    await install(page, embed());

    const poster = await page.locator('[data-video-embed]').boundingBox();
    const play = await page.locator('.c-video-embed__play').boundingBox();
    const width = page.viewportSize().width;

    expect(poster.width / poster.height).toBeCloseTo(16 / 9, 2);
    if (width >= DESKTOP) {
      // §Layout: the 1100 px desktop container, 72 px play button.
      expect(poster.width).toBeCloseTo(1100, 0);
      expect(play.width).toBeCloseTo(72, 0);
      expect(play.height).toBeCloseTo(72, 0);
    } else {
      // 100% − 2 × 14 px gutter; 60 px play button.
      expect(poster.width).toBeCloseTo(347, 0);
      expect(play.width).toBeCloseTo(60, 0);
      expect(play.height).toBeCloseTo(60, 0);
    }

    const centreLine = (box, axis) => box[axis] + box[axis === 'x' ? 'width' : 'height'] / 2;
    expect(Math.abs(centreLine(play, 'x') - centreLine(poster, 'x'))).toBeLessThanOrEqual(1);
    expect(Math.abs(centreLine(play, 'y') - centreLine(poster, 'y'))).toBeLessThanOrEqual(1);
  });
});
