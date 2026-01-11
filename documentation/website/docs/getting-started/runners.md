---
sidebar_position: 3
---

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

# Runners & loaders

Autometa supports multiple host runners. Each one uses a different “loader” to transform `.feature` files into the runner’s native test suites.

- **Jest**: transformer (`@autometa/jest-transformer`) + executor (`@autometa/jest-executor`)
- **Vitest**: Vite plugin (`@autometa/vitest-plugins`) + executor (`@autometa/vitest-executor`)
- **Playwright**: Node loader (`@autometa/playwright-loader`) + executor (`@autometa/playwright-executor`)

The CLI (`@autometa/cli`) is optional but useful: it reads `autometa.config.ts`, loads your step bundle, and can delegate execution to your chosen runner.

## Choosing a runner

- **Vitest**: fastest dev loop for Node/API tests; great for `.feature` authoring + watch mode.
- **Jest**: stable, widely adopted; good fit if your repo already standardizes on Jest.
- **Playwright**: best for browser/E2E, tracing, screenshots; requires a `.spec.ts` entrypoint (Playwright can’t discover `.feature` files directly).

## Setup (tabbed)

<Tabs groupId="runner" defaultValue="vitest" values={[{label: "Vitest", value: "vitest"},{label: "Jest", value: "jest"},{label: "Playwright", value: "playwright"}]}>
<TabItem value="vitest">

**Strengths**
- Fast feedback + great watch mode
- Native ESM-friendly workflow

**Tradeoffs**
- Not a browser runner (use Playwright for UI/E2E)

**Install**
```bash
pnpm add -D vitest
pnpm add @autometa/vitest-executor @autometa/vitest-plugins
```

**Vitest config**
```ts title="vitest.config.ts"
import { defineConfig } from "vitest/config";
import { autometa } from "@autometa/vitest-plugins";

export default defineConfig({
  plugins: [autometa()],
  test: {
    environment: "node",
    include: ["**/*.feature"],
  },
});
```

</TabItem>
<TabItem value="jest">

**Strengths**
- Common in monorepos; easy to integrate where Jest is already used

**Tradeoffs**
- ESM/TS configuration can be noisier than Vitest in some setups

**Install**
```bash
pnpm add -D jest ts-jest @types/jest
pnpm add @autometa/jest-executor @autometa/jest-transformer
```

**Jest config**
```js title="jest.config.cjs"
module.exports = {
  transform: {
    "^.+\\.feature$": "@autometa/jest-transformer",
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  testMatch: ["**/*.feature"],
  testEnvironment: "node",
};
```

</TabItem>
<TabItem value="playwright">

**Strengths**
- Browser automation + tracing/snapshots
- Best choice for UI/E2E validation

**Tradeoffs**
- Playwright does not discover `.feature` files by itself; you must import them from a `.spec.ts` entrypoint.

**Install**
```bash
pnpm add -D @playwright/test
pnpm add @autometa/playwright-executor @autometa/playwright-loader
```

**Entry spec**
```ts title="src/features.spec.ts"
import "@autometa/playwright-loader/register";

import "../features/login.feature";
import "../features/checkout.feature";
```

**Playwright config**
```ts title="playwright.config.ts"
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src",
  testMatch: "**/*.spec.ts",
});
```

</TabItem>
</Tabs>

## What the loader does

Regardless of runner, the loader is responsible for:

- Converting `.feature` documents into native suites/tests
- Loading step modules from `roots.steps` (and related roots like `roots.support`)
- Loading `events` modules (side effects / listeners) when configured

