# Autometa Runner Architecture & Roadmap

This document outlines the architectural strategy for Autometa's execution model, focusing on seamless integration with the JavaScript ecosystem's leading test runners (Vitest, Jest, Playwright) while maintaining `autometa` as the primary CLI interface.

## Core Philosophy: The "Premier CLI" Strategy

The goal is to make `autometa run` the "One Command to Rule Them All".
- **Unified Experience:** Users always run `autometa run`.
- **Native Power:** Under the hood, Autometa intelligently delegates execution to the user's configured runner (Vitest, Jest, Playwright), leveraging their native parallelism, reporting, and tooling.
- **Zero Config:** Users should not need to manually create bridge files (e.g., `*.test.ts`) to run features. The framework should handle this automatically.

## 1. The Bridge Pattern (Executor)

At the heart of this architecture is the **Bridge Pattern**. Instead of replacing the underlying runner, we *participate* in it.

*   **Concept:** We dynamically "unroll" Gherkin feature files into the native API of the runner (e.g., `describe`, `it`, `test`).
*   **Benefit:** This grants us native support for parallelism, IDE integration, and reporting without reinventing the wheel.

## 2. The Smart Orchestrator (`autometa run`)

**Status:** ✅ Implemented in `packages/cli/src/orchestrator/`

The `autometa run` command has evolved from a standalone runtime into a **Smart Orchestrator**.

**Workflow:**
1.  **Read Config:** Load `autometa.config.ts` to identify the target runner (`vitest`, `jest`, `playwright`, or `default`).
2.  **Auto-Detect:** If no runner specified, detect from config files (`vitest.config.ts`, `jest.config.js`, `playwright.config.ts`).
3.  **Construct Command:** Build the native command string with appropriate flags.
4.  **Delegate:** Spawn the runner process, inheriting stdio for seamless output.

**CLI Flags:**
- `--watch` - Run in watch mode (vitest watch, jest --watch, playwright --ui)
- `--verbose` - Show runner detection info
- `--standalone` - Force standalone runtime instead of native runner
- `--dry-run` - List tests without executing

**Implementation:**
```typescript
// packages/cli/src/orchestrator/index.ts
export async function orchestrate(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const runner = detectRunner(config, cwd);
  
  switch (runner) {
    case "vitest":
      return spawnVitest({ cwd, patterns, dryRun, watch, verbose });
    case "jest":
      return spawnJest({ cwd, patterns, dryRun, watch, verbose });
    case "playwright":
      return spawnPlaywright({ cwd, patterns, dryRun, watch, verbose });
    case "default":
      return { success: true, exitCode: 0, runner: "default" };
  }
}
```

---

## 3. Implementation Roadmap

### Priority 1: Vitest Integration (`@autometa/vitest-plugin`)

Vitest is the primary target. We will implement a Vite plugin to transform `.feature` files into test suites on the fly.

**Technical Approach:**
- **Package:** `packages/vitest-plugin`
- **Mechanism:** Vite `transform` hook.
- **Logic:**
    1.  Intercept imports of `*.feature`.
    2.  Read `autometa.config.ts` to locate the Step Definitions entry point.
    3.  Generate "Bridge Code" (JavaScript) that imports the steps and calls `execute()`.

**User Experience:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { autometa } from '@autometa/vitest-plugin';

export default defineConfig({
  plugins: [autometa()],
  test: { include: ['**/*.feature'] }
});
```

### Priority 2: Jest Integration (`@autometa/jest-transformer`)

Jest uses a synchronous transformation pipeline.

**Technical Approach:**
- **Package:** `packages/jest-transformer`
- **Mechanism:** Jest `transform` configuration.
- **Logic:** Similar to the Vitest plugin, but synchronous. Receives file content, returns compiled JS string.

**User Experience:**
```javascript
// jest.config.js
module.exports = {
  transform: { "^.+\\.feature$": "@autometa/jest-transformer" },
  testMatch: ["**/*.feature"]
};
```

### Priority 3: Playwright Integration (`@autometa/playwright-loader`)

**Status:** ✅ Orchestrator Support Added | ⏳ Loader Not Yet Implemented

Playwright relies on Node.js native execution and does not have a plugin system for file types. We must use Node.js Loaders.

**Current Implementation:**
- ✅ `runner: "playwright"` option added to `autometa.config.ts`
- ✅ Auto-detection of `playwright.config.ts` / `playwright.config.js`
- ✅ Orchestrator spawns `playwright test` with pattern and dry-run support
- ⏳ `@autometa/playwright-loader` package not yet created

**Technical Approach:**
- **Package:** `packages/playwright-loader`
- **Mechanism:** Node.js Module Customization Hooks (`resolve` and `load`).
- **Logic:**
    1.  Register via `NODE_OPTIONS="--import ..."` or `import` in config.
    2.  Intercept `*.feature` loads.
    3.  Return transformed ESM module content.

**User Experience:**
```typescript
// autometa.config.ts
export default defineConfig({
  runner: "playwright",
  roots: {
    features: ["features"],
    steps: ["steps"],
  },
});

// playwright.config.ts
import { defineConfig } from '@playwright/test';
import '@autometa/playwright-loader'; // Registers the loader (when implemented)

export default defineConfig({
  testMatch: '**/*.feature'
});
```

---

## 4. Reporting Strategy

To maintain a consistent and high-quality user experience across all runners, we will port the existing Autometa CLI reporter to each platform.

**Goal:**
Ensure that regardless of whether the user runs `vitest`, `jest`, or `playwright`, they see the familiar, readable Autometa output (Feature > Scenario > Step status).

**Implementation Plan:**
1.  **Shared Logic:** Extract the formatting and summary logic from `packages/cli` into a shared module (e.g., `packages/reporting` or exported from `packages/cli`).
2.  **Runner Adapters:** Implement a custom reporter for each runner that maps native events to Autometa's format.

**Example Output:**
```text
Feature: Manage Brew Buddy menu catalog
  ✓ Scenario: Retrieve the published menu (88 ms)
  ✓ Scenario: Remove a retired beverage (12 ms)
  ✓ Scenario: Update pricing in bulk (11 ms)
  Scenario Outline: Introduce a new seasonal beverage
  Scenario Outline: Seasonal availability matrix for <region>
  ✓ Scenario: Import multiple recipes using a data table (4 ms)
  ✓ Scenario: Use a doc string to capture tasting notes (2 ms)
  ✓ Scenario: Fetch menu catalog via GET (4 ms)
  ✓ Scenario: Create a new recipe via POST (4 ms)
```

### Vitest Reporter
- **Mechanism:** Implement `Reporter` interface from `vitest/reporters`.
- **Integration:** Added via `reporters` array in `vitest.config.ts`.

### Jest Reporter
- **Mechanism:** Implement `Reporter` interface from `@jest/reporters`.
- **Integration:** Added via `reporters` array in `jest.config.js`.

### Playwright Reporter
- **Mechanism:** Implement `Reporter` interface from `@playwright/test/reporter`.
- **Integration:** Added via `reporter` property in `playwright.config.ts`.

---

## 5. Future Roadmap: Native Parallel Runner

**Status:** Shelved (Breadcrumbs for Future)

We have decided to shelf the implementation of a custom parallel runner for the standalone `autometa` runtime to focus on ecosystem integration. However, this remains a valid path for a "pure" Node.js experience.

**The Vision:**
If we want `autometa run` (default mode) to support parallelism without Vitest/Jest, we would implement our own worker pool.

**Implementation Breadcrumbs:**
1.  **Library:** Use `tinypool` (lightweight, used by Vitest) or `piscina`.
2.  **Architecture:**
    - **Main Thread:** Discovers `.feature` files.
    - **Worker Pool:** Spawns N workers.
    - **Distribution:** Sends one feature file path to a worker.
    - **Worker:** Loads the feature, runs the steps (using `cli-runtime`), and returns a JSON result object.
    - **Aggregation:** Main thread collects results and prints the summary.
3.  **Challenges to Solve:**
    - **Console Output:** coordinating stdout/stderr from multiple threads.
    - **Process Lifecycle:** Handling `beforeAll`/`afterAll` hooks that might need to run per-thread vs. globally.
