// `scripts/check-tokens.mjs` guards the tokens-only rule: a widget stylesheet
// that reaches for `color: #fff` (or an rgb() colour, or a px font size) must
// fail `npm run lint`, naming the file. These tests prove that against a
// fixture and keep the project's own stylesheets honest.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFile, mkdir, mkdtemp, rm, writeFile
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  after, before, describe, it
} from 'mocha';
import {
  checkTokens, findStylesheets, findViolations
} from '../../scripts/check-tokens.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SCRIPT = fileURLToPath(new URL('../../scripts/check-tokens.mjs', import.meta.url));
const FIXTURE = fileURLToPath(new URL('../fixtures/check-tokens/widget.scss', import.meta.url));

const WIDGET = 'modules/example-widget/ui/src/index.scss';
const CLEAN = [
  '.s-clean {',
  '  color: var(--c-blue);',
  '  font-size: clamp(1.375rem, 1.33rem + 0.18vw, 1.5rem);',
  '  padding-block: var(--section-padding);',
  '}',
  ''
].join('\n');

describe('check-tokens', () => {
  describe('findViolations', () => {
    it('flags a hex colour, an rgb()/rgba() colour and a px font size', () => {
      const violations = findViolations(
        '.s-example { color: #fff; background: rgba(0, 0, 0, .4); font-size: 14px; }'
      );
      assert.deepEqual(
        violations.map(({ rule }) => rule).sort(),
        [ 'hex-colour', 'px-font-size', 'rgb-colour' ]
      );
      assert.equal(violations[0].line, 1);
    });

    it('accepts tokens, rem sizes and clamp() values', () => {
      assert.deepEqual(findViolations(CLEAN), []);
    });

    it('ignores raw values inside comments', () => {
      const source = [
        '// Hover uses #22528E',
        '/* font-size: 14px; */',
        '.s-example { color: var(--c-blue); }'
      ].join('\n');
      assert.deepEqual(findViolations(source), []);
    });
  });

  describe('checkTokens', () => {
    let root;

    before(async () => {
      root = await mkdtemp(path.join(tmpdir(), 'check-tokens-'));
      // A widget stylesheet straight from the fixture, with `color: #fff`.
      await mkdir(path.join(root, 'modules/example-widget/ui/src'), { recursive: true });
      await copyFile(FIXTURE, path.join(root, WIDGET));
      // `_tokens.scss` is the one file allowed to hold raw values.
      await writeFile(
        path.join(root, 'modules/example-widget/ui/src/_tokens.scss'),
        ':root { --c-blue: #002855; }\n'
      );
      // Stylesheets outside `ui/src/` never ship to the browser.
      await mkdir(path.join(root, 'modules/example-widget/src'), { recursive: true });
      await writeFile(
        path.join(root, 'modules/example-widget/src/index.scss'),
        '.s-admin { color: #fff; }\n'
      );
      // A stylesheet that follows the rule.
      await mkdir(path.join(root, 'modules/clean-widget/ui/src'), { recursive: true });
      await writeFile(path.join(root, 'modules/clean-widget/ui/src/index.scss'), CLEAN);
    });

    after(async () => {
      await rm(root, {
        recursive: true,
        force: true
      });
    });

    it('fails the widget stylesheet that contains `color: #fff`, naming the file', async () => {
      const violations = await checkTokens({ root });
      assert.deepEqual(
        violations.map(({ file, rule }) => `${file} ${rule}`),
        [ `${WIDGET} hex-colour`, `${WIDGET} rgb-colour`, `${WIDGET} px-font-size` ]
      );
      assert.match(violations[0].source, /color: #fff/);
    });

    it('checks only `modules/**/ui/src/**/*.scss`', async () => {
      const files = (await findStylesheets(root))
        .map((file) => path.relative(root, file).split(path.sep).join('/'))
        .sort();
      assert.deepEqual(files, [
        'modules/clean-widget/ui/src/index.scss',
        'modules/example-widget/ui/src/_tokens.scss',
        WIDGET
      ]);
    });

    it('exits 1 and names the file when run as `npm run lint` runs it', () => {
      const result = spawnSync(process.execPath, [ SCRIPT, root ], { encoding: 'utf8' });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, new RegExp(`${WIDGET.replaceAll('/', '\\/')}:\\d+`));
      assert.match(result.stderr, /color: #fff/);
    });

    it('exits 0 on the project itself', () => {
      const result = spawnSync(process.execPath, [ SCRIPT, REPO_ROOT ], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    });

    it('reports no violations in the project stylesheets', async () => {
      assert.deepEqual(await checkTokens({ root: REPO_ROOT }), []);
    });
  });
});
