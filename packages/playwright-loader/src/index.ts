/**
 * @autometa/playwright-loader
 *
 * Node.js module loader hooks for transforming .feature files into Playwright test suites.
 *
 * This package provides the infrastructure to run Gherkin feature files directly
 * with Playwright, leveraging Node.js customization hooks to transform .feature
 * imports on-the-fly.
 *
 * ## Usage
 *
 * ### Option 1: Import in playwright.config.ts
 * ```typescript
 * import '@autometa/playwright-loader/register';
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   testMatch: '**\/*.feature',
 * });
 * ```
 *
 * ### Option 2: Use with NODE_OPTIONS
 * ```bash
 * NODE_OPTIONS="--import @autometa/playwright-loader/register" npx playwright test
 * ```
 *
 * @packageDocumentation
 */

export { resolve, load } from "./loader.js";
export { generateBridgeCode } from "./bridge-generator.js";
