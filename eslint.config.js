import apostrophe from 'eslint-config-apostrophe';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  apostrophe,
  {
    // JSX templates render on the server only: there is no reconciler, so no `key` props
    // (AGENTS.md, "Nunjucks → JSX Gotchas").
    files: [ '**/*.jsx' ],
    rules: {
      'react/jsx-key': 'off'
    }
  },
  {
    // Command-line scripts report through the console.
    files: [ 'scripts/**' ],
    rules: {
      'no-console': 'off'
    }
  }
]);
