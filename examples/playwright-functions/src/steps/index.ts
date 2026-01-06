// IMPORTANT:
// The Playwright loader cannot synchronously load TypeScript config to discover
// step roots, so it falls back to conventions (e.g. `src/steps`).
//
// To keep the example delete-friendly (no `src/step-definitions.ts` shim), we
// export the runner steps environment from within `src/steps`.
export { stepsEnvironment } from "../autometa/steps";

import "./system/setup.steps";
import "./system/debug.steps";
import "./system/lifecycle.steps";

import "./brew-buddy/requests.steps";
import "./brew-buddy/menu.steps";
import "./brew-buddy/orders.steps";
import "./brew-buddy/recipes.steps";
import "./brew-buddy/tags.steps";
