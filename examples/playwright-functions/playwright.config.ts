import { defineConfig } from "@playwright/test";

/**
 * Playwright configuration for Autometa feature tests.
 *
 * This uses the @autometa/playwright-loader to transform .feature files
 * into executable Playwright test suites.
 */
export default defineConfig({
  testDir: "./src",
  testMatch: "**/*.spec.ts",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Number of workers */
  workers: process.env.CI ? 1 : 4,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "list",

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BREW_BUDDY_BASE_URL ?? "http://localhost:4000",

    /* Collect trace when retrying the failed test. */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "api",
      use: {},
      testMatch: "**/*.spec.ts",
    },
  ],

  /* Global timeout for each test */
  timeout: 30_000,

  /* Timeout for each expect() assertion */
  expect: {
    timeout: 5_000,
  },
});
