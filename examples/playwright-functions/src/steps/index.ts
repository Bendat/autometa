/**
 * Deprecated.
 *
 * Step discovery is driven by `autometa.config.ts` globs now:
 * - `src/autometa/steps.ts` (exports `stepsEnvironment`)
 * - `src/steps/**` + `/*.steps.*` (step definition modules)
 *
 * This file used to be a shim/barrel for Playwright step loading.
 * It is intentionally empty and can be deleted.
 */
export {};
