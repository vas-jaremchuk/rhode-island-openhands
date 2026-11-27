// Shared UI foundation: the field presets every section widget spreads into
// its schema (`lib/fields.js`), the components every section widget renders
// (`views/components/ui.jsx`), the icon sprite and SVG upload sanitization.
import assert from 'node:assert/strict';
import {
  readFile, rm, writeFile
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  after, before, describe, it
} from 'mocha';
import {
  cta, lead, sectionHeading, video
} from '../../lib/fields.js';
import { startApos, testDbPath } from './helpers.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const require = createRequire(import.meta.url);

// A schema is what `apos.schema.compose` returns from the `addFields` array
// form; `fieldsToArray` turns a preset's `{ add: … }` shape into that array and
// composes the nested schema of an object field.
function composeSchema(apos, fields) {
  return apos.schema.compose({
    addFields: apos.schema.fieldsToArray('ui-components-test', fields)
  });
}

function field(schema, name) {
  return schema.find((candidate) => candidate.name === name);
}

describe('shared UI components', function () {
  this.timeout(60000);

  const db = testDbPath();
  let site;
  let ui;
  let flatten;

  // JSX is compiled by the require hook Apostrophe installs at boot, so the
  // component library and the runtime can only be loaded after `startApos`.
  const render = (node) => flatten(node);

  before(async () => {
    site = await startApos({ db });
    ui = require(path.join(REPO_ROOT, 'views/components/ui.jsx'));
    ({ flatten } = require('apostrophe/modules/@apostrophecms/template/lib/jsxRuntime.js'));
  });

  after(async () => {
    await site.stop();
  });

  describe('lib/fields.js presets', () => {
    it('builds the video object from reference/spec/03-backend.md §2', () => {
      const schema = composeSchema(site.apos, { ...video() });
      const videoField = field(schema, 'video');

      assert.equal(videoField.type, 'object');
      assert.ok(Array.isArray(videoField.schema), 'the object field has a schema');

      const media = field(videoField.schema, 'media');
      assert.equal(media.type, 'oembed');
      assert.equal(media.oembedType, 'video');
      assert.equal(media.required, true);

      const poster = field(videoField.schema, '_poster');
      assert.equal(poster.type, 'relationship');
      assert.equal(poster.withType, '@apostrophecms/image');
      assert.equal(poster.max, 1);
      assert.equal(poster.required, true);

      const title = field(videoField.schema, 'title');
      assert.equal(title.type, 'string');
      assert.equal(title.required, true);
    });

    it('builds the section heading fields with the requested default alignment', () => {
      const centred = composeSchema(site.apos, { ...sectionHeading() });
      const left = composeSchema(site.apos, { ...sectionHeading({ align: 'left' }) });

      assert.equal(field(centred, 'eyebrow').max, 40);
      assert.equal(field(centred, 'title').required, true);
      assert.equal(field(centred, 'title').max, 80);
      assert.equal(field(centred, 'headingLevel').def, 'h2');
      assert.equal(field(centred, 'align').def, 'center');
      assert.equal(field(left, 'align').def, 'left');
    });

    it('builds the cta and lead fields', () => {
      const schema = composeSchema(site.apos, {
        ...cta(),
        ...lead()
      });
      const ctaField = field(schema, 'cta');

      assert.equal(ctaField.type, 'object');
      assert.equal(field(ctaField.schema, 'label').type, 'string');
      assert.equal(field(ctaField.schema, 'url').type, 'url');
      assert.equal(field(ctaField.schema, 'newTab').def, false);
      assert.equal(field(ctaField.schema, 'showArrow').def, true);

      const leadField = field(schema, 'lead');
      assert.equal(leadField.type, 'string');
      assert.equal(leadField.textarea, true);
      assert.equal(leadField.max, 400);
    });
  });

  describe('Button', () => {
    it('renders one anchor with the label, the arrow icon and the solid class', async () => {
      const html = await render(ui.Button({
        apos: site.apos,
        cta: {
          label: 'Tour our facility',
          url: 'https://www.organogenesis.com/'
        },
        arrow: true
      }));

      assert.match(html, /^<a [^>]*class="c-btn c-btn--solid"/);
      assert.match(html, /href="https:\/\/www\.organogenesis\.com\/"/);
      assert.match(html, /Tour our facility/);
      assert.match(html, /#arrow-right/);
      assert.equal((html.match(/<a\b/g) || []).length, 1);
    });

    it('renders nothing when the label or the URL is empty', async () => {
      assert.equal(await render(ui.Button({
        apos: site.apos,
        cta: {
          label: '',
          url: 'https://www.organogenesis.com/'
        },
        arrow: true
      })), '');
      assert.equal(await render(ui.Button({
        apos: site.apos,
        cta: {
          label: 'Tour our facility',
          url: ''
        },
        arrow: true
      })), '');
    });

    it('renders the outline variants and opens a new tab when asked', async () => {
      const outline = await render(ui.Button({
        apos: site.apos,
        cta: {
          label: 'Learn more',
          url: 'https://www.organogenesis.com/'
        },
        variant: 'outline-yellow'
      }));
      assert.match(outline, /class="c-btn c-btn--outline-yellow"/);
      assert.doesNotMatch(outline, /#arrow-right/);

      const newTab = await render(ui.Button({
        apos: site.apos,
        cta: {
          label: 'Investors',
          url: 'https://www.organogenesis.com/',
          newTab: true
        }
      }));
      assert.match(newTab, /target="_blank"/);
      assert.match(newTab, /rel="noopener noreferrer"/);
    });
  });

  describe('SectionHeading', () => {
    it('renders one heading element with the eyebrow and title spans', async () => {
      const html = await render(ui.SectionHeading({
        eyebrow: 'About our',
        title: 'Rhode Island facility'
      }));

      assert.match(html, /^<h2 class="c-section-heading c-section-heading--center c-section-heading--blue">/);
      assert.equal((html.match(/<h2\b/g) || []).length, 1);
      assert.equal((html.match(/<span\b/g) || []).length, 2);
      assert.match(html, /class="c-section-heading__eyebrow t-eyebrow">About our</);
      assert.match(html, /class="c-section-heading__title t-title-xl">Rhode Island facility</);
    });

    it('honours the heading level, alignment and tone', async () => {
      const html = await render(ui.SectionHeading({
        eyebrow: 'How we’re',
        title: 'Making a difference',
        level: 'h3',
        align: 'left',
        tone: 'white'
      }));

      assert.match(html, /^<h3 class="c-section-heading c-section-heading--left c-section-heading--white"/);
    });

    it('renders nothing when there is no copy yet', async () => {
      assert.equal(await render(ui.SectionHeading({})), '');
    });
  });

  describe('LinkMore', () => {
    it('renders a link and nothing when the URL is missing', async () => {
      const html = await render(ui.LinkMore({
        url: 'https://www.organogenesis.com/',
        label: 'READ MORE'
      }));
      assert.equal(html, '<a class="c-link-more" href="https://www.organogenesis.com/">READ MORE</a>');
      assert.equal(await render(ui.LinkMore({
        url: '',
        label: 'READ MORE'
      })), '');
    });
  });

  describe('Picture', () => {
    const image = {
      alt: 'A technician in a cleanroom',
      attachment: {
        _id: 'abc123',
        name: 'photo.jpg',
        extension: 'jpg',
        group: 'images',
        width: 1200,
        height: 800
      }
    };

    it('renders srcset, intrinsic size and lazy loading by default', async () => {
      const html = await render(ui.Picture({
        apos: site.apos,
        image,
        sizes: '(min-width: 1200px) 1100px, 100vw'
      }));

      assert.match(html, /^<img /);
      assert.match(html, /src="[^"]*abc123-photo\.jpg\.full\.jpg"/);
      assert.match(html, /srcset="[^"]*1200w/);
      assert.match(html, /sizes="\(min-width: 1200px\) 1100px, 100vw"/);
      assert.match(html, /width="1200"/);
      assert.match(html, /height="800"/);
      assert.match(html, /alt="A technician in a cleanroom"/);
      assert.match(html, /loading="lazy"/);
      assert.doesNotMatch(html, /fetchpriority/);
    });

    it('loads eagerly with high priority when asked', async () => {
      const html = await render(ui.Picture({
        apos: site.apos,
        image,
        priority: true
      }));

      assert.match(html, /loading="eager"/);
      assert.match(html, /fetchpriority="high"/);
    });

    it('renders nothing without an attachment', async () => {
      assert.equal(await render(ui.Picture({
        apos: site.apos,
        image: null
      })), '');
    });
  });

  describe('Icon', () => {
    it('references the sprite and hides itself from assistive tech without a label', async () => {
      const html = await render(ui.Icon({
        apos: site.apos,
        name: 'newspaper'
      }));

      assert.match(html, /^<svg /);
      assert.match(html, /aria-hidden="true"/);
      assert.doesNotMatch(html, /role="img"/);
      assert.match(html, /<use href="[^"]*\/modules\/asset\/icons\.svg#newspaper"/);
    });

    it('is an image with an accessible name when a label is given', async () => {
      const html = await render(ui.Icon({
        apos: site.apos,
        name: 'globe',
        label: 'Website'
      }));

      assert.match(html, /role="img"/);
      assert.match(html, /aria-label="Website"/);
      assert.doesNotMatch(html, /aria-hidden/);
    });
  });

  describe('icon sprite', () => {
    it('has the seven symbols from Q-2 and keeps the licence attribution', async () => {
      const sprite = await readFile(path.join(REPO_ROOT, 'modules/asset/public/icons.svg'), 'utf8');
      const ids = [ ...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g) ]
        .map((match) => match[1])
        .sort();

      assert.deepEqual(ids, [
        'arrow-right',
        'calendar-days',
        'chevron-down',
        'chevron-left',
        'chevron-right',
        'globe',
        'newspaper'
      ]);
      assert.match(sprite, /CC BY 4\.0/);
      assert.match(sprite, /Feather/);
    });
  });

  describe('SVG uploads', () => {
    it('stores an uploaded SVG without scripts or event attributes', async () => {
      const source = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" onload="alert(1)">',
        '<script>alert(1)</script>',
        '<rect width="10" height="10" onclick="alert(1)"/>',
        '</svg>'
      ].join('');
      const file = path.join(tmpdir(), `svg-sanitize-${process.pid}.svg`);
      await writeFile(file, source);

      try {
        const req = site.apos.task.getReq();
        const attachment = await site.apos.attachment.insert(req, {
          name: 'unsafe.svg',
          path: file
        });
        const image = await site.apos.modules['@apostrophecms/image'].insert(req, {
          title: 'SVG sanitization test',
          alt: '',
          slug: 'image-svg-sanitization-test',
          attachment
        });

        const url = site.apos.attachment.url(image.attachment, { size: 'full' });
        const response = await fetch(new URL(url, site.url));
        assert.equal(response.status, 200, `${url} answers 200`);

        const stored = await response.text();
        assert.doesNotMatch(stored, /<script/i);
        assert.doesNotMatch(stored, /\son[a-z]+\s*=/i);
      } finally {
        await rm(file, { force: true });
      }
    });
  });
});
