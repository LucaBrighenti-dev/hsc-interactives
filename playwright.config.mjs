// Playwright: smoke and acceptance tests against a built dist/ (run `npm run build` first; `npm run check` does).
import { createHash } from 'node:crypto';
import { defineConfig } from '@playwright/test';

// Each worktree gets its own port (derived from its folder), so agents running e2e in parallel never
// reuse another worktree's server and test the wrong dist/. E2E_PORT overrides it.
function worktreePort() {
  const n = 4200 + (parseInt(createHash('sha1').update(process.cwd()).digest('hex').slice(0, 6), 16) % 1800);
  return n === 5173 ? 5174 : n; // keep clear of the dev server
}
const PORT = Number(process.env.E2E_PORT) || worktreePort();

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.mjs',
  outputDir: 'test-results/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } } },
    // Acceptance numbers do not depend on the viewport, so they run on desktop only.
    { name: 'tablet', testIgnore: '**/acceptance.spec.mjs', use: { browserName: 'chromium', viewport: { width: 1180, height: 820 }, hasTouch: true } },
    { name: 'phone', testIgnore: '**/acceptance.spec.mjs', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: `node scripts/dev.mjs --serve-only --port ${PORT}`,
    url: `http://localhost:${PORT}/catalog.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
