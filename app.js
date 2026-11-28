import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import apostrophe from 'apostrophe';

// The site runs on SQLite (no database server). `.env` is not committed, so fall
// back to the project's database file; staging and production set APOS_DB_URI.
process.env.APOS_DB_URI ??= 'sqlite://data/site.db';

// The module registry lives here so `node app` and the server test harness
// (`test/server/helpers.mjs`, which boots these modules programmatically) share
// one list. New modules are still registered in this file.
export const aposOptions = {
  root: import.meta,
  shortName: 'organo-ri',
  modules: {
    // Apostrophe module configuration
    // *******************************
    //
    // Most configuration occurs in the respective modules' directories.
    // Any module that is not present by default in Apostrophe must at least
    // have a minimal configuration here to turn it on: `moduleName: {}`
    '@apostrophecms/rich-text-widget': {
      options: {
        className: 'bp-rich-text'
      }
    },
    '@apostrophecms/image-widget': {
      options: {
        className: 'bp-image-widget'
      }
    },
    '@apostrophecms/video-widget': {
      options: {
        className: 'bp-video-widget'
      }
    },
    // The media library accepts SVG (logos, the 100-year lock-up) and
    // sanitizes every SVG on upload.
    '@apostrophecms/attachment': {},
    // Header and SEO settings for the site chrome (reference/spec/03-backend.md §4).
    '@apostrophecms/global': {},
    // `asset` supports the project's build for client-side assets.
    asset: {},
    // Vite bundles client-side assets and provides hot module reloading.
    '@apostrophecms/vite': {},
    'default-page': {},
    'nested-layout-widget': {},
    'nested-column-widget': {},
    // News & Events pieces the news section lists (reference/spec/03-backend.md §5).
    'news-item': {},
    // CLI tasks that build the demo content (`site:seed`, `site:reset`).
    site: {}
  }
};

// Only start the site when this file is the entry point (`node app`, `npm run dev`,
// `node app <task>`). Importing it for the options must not boot a second instance.
const entryUrl = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (entryUrl === import.meta.url || entryUrl + '.js' === import.meta.url) {
  apostrophe(aposOptions);
}
