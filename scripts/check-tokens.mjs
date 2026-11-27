#!/usr/bin/env node
// Guards the "tokens only" rule from AGENTS.md and reference/spec/04-frontend.md
// §Styles: outside `modules/asset/ui/src/scss/_tokens.scss` a project
// stylesheet may not contain a hex colour, rgb()/rgba() or a px font size.
// Everything must come from the custom properties declared in the tokens file.
//
// Run by `npm run lint`, which passes the repository root as the first argument
// (defaults to the working directory).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The only stylesheet allowed to hold raw values (see the header comment).
const TOKENS_BASENAME = '_tokens.scss';

// Only stylesheets that ship to the browser are checked: `modules/**/ui/src/`.
const UI_FOLDER = 'ui';
const SRC_FOLDER = 'src';

const RULES = [
  {
    id: 'hex-colour',
    pattern: /#[0-9a-f]{3,8}\b/i,
    message: 'hex colour — use a --c-* / --g-* token'
  },
  {
    id: 'rgb-colour',
    pattern: /\brgba?\(/i,
    message: 'rgb()/rgba() colour — use a --c-* / --g-* token'
  },
  {
    id: 'px-font-size',
    pattern: /\bfont-size\s*:\s*-?(?:\d*\.)?\d+px\b/i,
    message: 'px font size — use a .t-* utility or a --f-* token'
  }
];

// Blank out comments so prose and commented-out code do not fail the check.
// Both replacements keep the line count, so reported line numbers stay right.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

// Violations in one stylesheet's source, with 1-based line numbers.
export function findViolations(source) {
  const violations = [];
  stripComments(source).split('\n').forEach((line, index) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        violations.push({
          line: index + 1,
          rule: rule.id,
          message: rule.message,
          source: line.trim()
        });
      }
    }
  });
  return violations;
}

async function collectScss(dir, found = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectScss(entryPath, found);
    } else if (entry.name.endsWith('.scss')) {
      found.push(entryPath);
    }
  }
  return found;
}

// Every `modules/**/ui/src/**/*.scss` file under `root`, as absolute paths.
export async function findStylesheets(root) {
  const modulesDir = path.join(root, 'modules');
  const files = await collectScss(modulesDir);
  return files.filter((file) => {
    const segments = path.relative(modulesDir, file).split(path.sep);
    const ui = segments.indexOf(UI_FOLDER);
    return ui !== -1 && segments[ui + 1] === SRC_FOLDER;
  });
}

// Every violation in the project under `root`, with repo-relative file paths.
export async function checkTokens({ root = process.cwd() } = {}) {
  const files = await findStylesheets(root);
  const violations = [];
  for (const file of files) {
    if (path.basename(file) === TOKENS_BASENAME) {
      continue;
    }
    const source = await readFile(file, 'utf8');
    const relative = path.relative(root, file).split(path.sep).join('/');
    for (const violation of findViolations(source)) {
      violations.push({
        file: relative,
        ...violation
      });
    }
  }
  return violations;
}

function formatViolation({
  file, line, message, rule, source
}) {
  return `${file}:${line}  ${message} [${rule}]  ${source}`;
}

async function main() {
  const root = process.argv[2] || process.cwd();
  const violations = await checkTokens({ root });
  if (violations.length === 0) {
    return;
  }
  for (const violation of violations) {
    console.error(formatViolation(violation));
  }
  console.error(
    `\ncheck-tokens: ${violations.length} violation(s). ` +
    'Raw values belong in modules/asset/ui/src/scss/_tokens.scss only.'
  );
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
