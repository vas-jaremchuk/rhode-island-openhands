import 'dotenv/config';
import apostrophe from 'apostrophe';

// The site runs on SQLite (no database server). `.env` is not committed, so fall
// back to the project's database file; staging and production set APOS_DB_URI.
process.env.APOS_DB_URI ??= 'sqlite://data/site.db';

apostrophe({
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
    // `asset` supports the project's build for client-side assets.
    asset: {},
    // Vite bundles client-side assets and provides hot module reloading.
    '@apostrophecms/vite': {},
    'default-page': {},
    'nested-layout-widget': {},
    'nested-column-widget': {}
  }
});
