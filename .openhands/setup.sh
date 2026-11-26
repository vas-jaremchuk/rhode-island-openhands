#!/bin/bash
# OpenHands sandbox setup: prepares the workspace before the agent starts.
# Runs from the repository root; every step is safe to repeat.
set -eo pipefail

echo "Checking Node.js (apostrophe 4.34 needs >= 22.12)"
node -e '
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) {
    console.error(`Node.js ${process.versions.node} found; apostrophe 4.34 needs >= 22.12 (package.json engines).`);
    process.exit(1);
  }
  console.log(`Node.js ${process.versions.node}`);
'

echo "Installing dependencies from the lockfile (npm only: pnpm/yarn skip native builds)"
npm ci --no-audit --no-fund

echo "Migrating the SQLite database (data/site.db) and creating the admin user"
npm run setup

if [ -f playwright.config.js ]; then
  echo "Installing Chromium for the Playwright browser tests"
  npx playwright install --with-deps chromium
fi

echo "Setup done"
