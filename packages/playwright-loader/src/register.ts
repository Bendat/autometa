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
import { pathToFileURL } from "node:url";

// Register the loader hooks
register("./loader.js", pathToFileURL(import.meta.url));
