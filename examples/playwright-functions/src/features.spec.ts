/**
 * Feature Test Loader
 *
 * This file imports all .feature files from the shared features directory.
 * The @autometa/playwright-loader transforms these imports into Playwright tests.
 */

// Import feature files - the loader will transform these into test.describe blocks
// @ts-expect-error - .feature files are transformed by the loader
import "../../.features/http/http-client.feature";
// // @ts-expect-error - .feature files are transformed by the loader
// import "../../.features/http/lifecycle-hooks.feature";
// // @ts-expect-error - .feature files are transformed by the loader
// import "../../.features/http/order-streaming.feature";
// // @ts-expect-error - .feature files are transformed by the loader
// import "../../.features/http/recipe-resource.feature";
