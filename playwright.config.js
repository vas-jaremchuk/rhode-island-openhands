import { defineConfig } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// The sandbox ships a system Chromium and points this variable at it, so the
// browser tests never download one (`.agents/skills/apostrophe-pitfalls`). CI and
// developer machines leave it unset and use the browser `npx playwright install
// chromium` provides.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30000,
  // SQLite is one file: parallel workers would race on it.
  workers: 1,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {})
  },
  projects: [
    {
      name: 'desktop',
      use: {
        viewport: {
          width: 1440,
          height: 900
        }
      }
    },
    {
      name: 'mobile',
      use: {
        viewport: {
          width: 375,
          height: 812
        }
      }
    }
  ],
  webServer: {
    // A throwaway database per run: `npm run setup` migrates an empty file and
    // creates the admin user, so nothing a previous run wrote can be mistaken
    // for a working seed.
    command: 'rm -f data/e2e.db* && npm run setup && npm start',
    url: `${BASE_URL}/`,
    timeout: 180000,
    // A leftover process would serve the previous run's database, so never
    // reuse one: fail with "port is already used" instead.
    reuseExistingServer: false,
    env: {
      APOS_DB_URI: 'sqlite://data/e2e.db',
      PORT: String(PORT)
    }
  }
});
