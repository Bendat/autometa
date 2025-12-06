/**
 * Registration entry point for Node.js module hooks.
 *
 * Import this module to register the .feature file loader:
 *
 * ```typescript
 * import '@autometa/playwright-loader/register';
 * ```
 *
 * Or use with NODE_OPTIONS:
 * ```bash
 * NODE_OPTIONS="--import @autometa/playwright-loader/register" npx playwright test
 * ```
 */

import { register } from "node:module";

// Register the loader hooks
// The second parameter should be the parent URL, and the first should be
// the specifier to resolve from that parent
register("./loader.js", import.meta.url);
