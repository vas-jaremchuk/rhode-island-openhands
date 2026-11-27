// Site layout — Task 06. The Global Header and SEO groups
// (reference/spec/03-backend.md §4), their seed, and the header, footer and
// <head> that `views/layout.jsx` renders at both design widths.
import assert from 'node:assert/strict';
import {
  after, before, describe, it
} from 'mocha';
import { startApos, testDbPath } from './helpers.mjs';

const SEEDED_TITLE = 'Organogenesis Rhode Island';

describe('site layout', function () {
  this.timeout(180000);

  const db = testDbPath();
  let site;

  const globalModule = () => site.apos.modules['@apostrophecms/global'];
  const publishedReq = () => site.apos.task.getReq({ mode: 'published' });
  const findGlobal = () => globalModule().findGlobal(publishedReq());
  const field = (schema, name) => schema.find((candidate) => candidate.name === name);

  const homeHtml = async () => {
    const response = await fetch(`${site.url}/`);
    assert.equal(response.status, 200);
    return response.text();
  };

  before(async () => {
    site = await startApos({ db });
    await site.apos.task.invoke('site:seed');
  });

  after(async () => {
    await site.stop();
  });

  describe('Global settings schema', () => {
    it('has the Header group from reference/spec/03-backend.md §4', () => {
      const { schema } = globalModule();

      const logo = field(schema, '_headerLogo');
      assert.equal(logo.type, 'relationship');
      assert.equal(logo.withType, '@apostrophecms/image');
      assert.equal(logo.max, 1);
      assert.equal(logo.group.label, 'Header');

      const mobile = field(schema, '_headerLogoMobile');
      assert.equal(mobile.type, 'relationship');
      assert.equal(mobile.withType, '@apostrophecms/image');
      assert.equal(mobile.max, 1);
      assert.equal(mobile.group.label, 'Header');

      const links = field(schema, 'utilityLinks');
      assert.equal(links.type, 'array');
      assert.equal(links.group.label, 'Header');
      assert.deepEqual(links.schema.map(({ name }) => name), [
        'label',
        'url',
        'style'
      ]);

      const style = field(links.schema, 'style');
      assert.equal(style.type, 'select');
      assert.deepEqual(style.choices.map(({ value }) => value), [ 'link', 'outline' ]);
      assert.equal(style.def, 'link');
    });

    it('has the SEO group from reference/spec/03-backend.md §4', () => {
      const { schema } = globalModule();

      const title = field(schema, 'siteTitle');
      assert.equal(title.type, 'string');
      assert.equal(title.group.label, 'SEO');

      const description = field(schema, 'metaDescription');
      assert.equal(description.type, 'string');
      assert.equal(description.textarea, true);
      assert.equal(description.group.label, 'SEO');

      const image = field(schema, '_ogImage');
      assert.equal(image.type, 'relationship');
      assert.equal(image.withType, '@apostrophecms/image');
      assert.equal(image.max, 1);
      assert.equal(image.group.label, 'SEO');
    });
  });

  describe('seed', () => {
    it('fills the header wordmarks, the utility links and the SEO fields', async () => {
      const global = await findGlobal();

      assert.equal(global.siteTitle, SEEDED_TITLE);
      assert.match(global.metaDescription, /Organogenesis in Rhode Island/);
      assert.deepEqual(
        global.utilityLinks.map(({
          label, url, style
        }) => ({
          label,
          url,
          style
        })),
        [
          {
            label: 'OUR STORY',
            url: 'https://www.organogenesis.com/',
            style: 'link'
          },
          {
            label: 'INVESTORS & MEDIA',
            url: 'https://www.organogenesis.com/',
            style: 'link'
          },
          {
            label: 'CONTACT US',
            url: '#contact',
            style: 'outline'
          }
        ]
      );
      assert.equal(global._headerLogo[0].title, 'Organogenesis wordmark');
      assert.equal(global._headerLogoMobile[0].title, 'Organogenesis wordmark mobile');
      assert.equal(global._ogImage[0].title, 'Hero background');
    });

    it('changes nothing when it runs a second time', async () => {
      const before = await findGlobal();
      await site.apos.task.invoke('site:seed');
      const after = await findGlobal();

      assert.equal(after.siteTitle, before.siteTitle);
      assert.equal(after.utilityLinks.length, before.utilityLinks.length);
      assert.equal(after._headerLogo[0]._id, before._headerLogo[0]._id);
      assert.equal(after._ogImage[0]._id, before._ogImage[0]._id);
    });
  });

  describe('rendered page', () => {
    it('renders the header with the wordmark and the three utility links in order', async () => {
      const html = await homeHtml();
      const start = html.indexOf('<header class="c-header"');
      const end = html.indexOf('</header>');
      assert.ok(start !== -1 && end > start, 'the page has a header');

      const header = html.slice(start, end);
      assert.match(header, /<nav class="c-header__utility">/);

      const labels = [ 'OUR STORY', 'INVESTORS &amp; MEDIA', 'CONTACT US' ];
      const positions = labels.map((label) => header.indexOf(label));
      for (const [ index, position ] of positions.entries()) {
        assert.ok(position !== -1, `the header shows ${labels[index]}`);
        if (index > 0) {
          assert.ok(position > positions[index - 1], `${labels[index]} follows ${labels[index - 1]}`);
        }
      }
      assert.match(header, /<a class="c-btn c-btn--outline-white" href="#contact">/);
      assert.match(header, /<a class="c-header__link" href="https:\/\/www\.organogenesis\.com\/">OUR STORY</);

      assert.match(header, /<source media="\(min-width: 1200px\)" srcset="[^"]*header-wordmark\.svg"/);
      assert.match(header, /<img class="c-header__logo-img" src="[^"]*header-wordmark-375\.svg"/);
      assert.match(header, /alt=""/);
    });

    it('renders the empty footer landmark', async () => {
      const html = await homeHtml();
      assert.match(html, /<footer class="c-footer"><\/footer>/);
    });

    it('renders the title, description, Open Graph image and canonical URL from Global', async () => {
      const html = await homeHtml();
      const global = await findGlobal();

      assert.match(html, new RegExp(`<title>${SEEDED_TITLE}</title>`));
      assert.match(html, new RegExp(`<meta name="description" content="${global.metaDescription}"`));
      assert.match(html, new RegExp(`<meta property="og:image" content="${site.url}/uploads/[^"]+hero-background[^"]*"`));
      assert.match(html, new RegExp(`<link rel="canonical" href="${site.url}/"`));
    });

    it('uses a changed siteTitle in the page title once it is published', async () => {
      const global = await findGlobal();
      await globalModule().update(publishedReq(), {
        ...global,
        siteTitle: 'Rhode Island Test Title'
      });

      const html = await homeHtml();
      assert.match(html, /<title>Rhode Island Test Title<\/title>/);
    });
  });
});
