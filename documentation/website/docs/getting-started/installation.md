---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

Autometa v1 installs through any Node package manager. The packages published under `@autometa/*` share version numbers, so a single install command keeps the coordinator, runner, executors, builder, and assertion libraries in sync.

## Core packages

Prefer the umbrella package:

- `@autometa/core` – ergonomics-focused entrypoint that re-exports user-facing APIs via subpaths:
	- `@autometa/core/runner`, `@autometa/core/config`, `@autometa/core/assert`, `@autometa/core/http`, etc.

Install the CLI and core:

```bash
pnpm add -D @autometa/cli typescript
pnpm add @autometa/core
```

You can still import specific packages directly if you prefer, but `@autometa/core` keeps imports consistent across examples and reduces boilerplate.

## Configure your runner

Pick the tab that matches your stack. Each snippet mirrors the code in `/examples/<runner>-functions`, so you can copy it verbatim and adapt paths as needed.

Runner integrations are installed separately (they are not bundled into `@autometa/cli`). For example, there is no `@autometa/playwright-runner` package — Playwright support comes from `@autometa/playwright-loader` and `@autometa/playwright-executor`.

<Tabs groupId="runner" defaultValue="jest" values={[{label: 'Jest', value: 'jest'},{label: 'Vitest', value: 'vitest'},{label: 'Playwright', value: 'playwright'}]}>

<TabItem value="jest">

### 1. Install runner dependencies

```bash
pnpm add -D jest ts-jest @types/jest
pnpm add @autometa/jest-executor @autometa/jest-transformer
```

### 2. Create `autometa.config.ts`

```ts title="autometa.config.ts"
import { defineConfig } from "@autometa/core/config";

export default defineConfig({
	default: {
		runner: "jest",
		roots: {
			features: ["./features"],
			steps: ["./src/step-definitions.ts"],
		},
	},
});
```

### 3. Wire the Jest transformer

```js title="jest.config.cjs"
module.exports = {
	transform: {
		"^.+\\.feature$": "@autometa/jest-transformer",
		"^.+\\.tsx?$": [
			"ts-jest",
			{ useESM: true },
		],
	},
	testMatch: ["**/features/**/*.feature"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "feature"],
	extensionsToTreatAsEsm: [".ts"],
	testEnvironment: "node",
};
```

### 4. Run the features

Add `"features": "jest --config jest.config.cjs"` to your `package.json` scripts and execute `pnpm features`.

</TabItem>

<TabItem value="vitest">

### 1. Install runner dependencies

```bash
pnpm add -D vitest
pnpm add @autometa/vitest-executor @autometa/vitest-plugins
```

### 2. Create `autometa.config.ts`

```ts title="autometa.config.ts"
import { defineConfig } from "@autometa/core/config";

export default defineConfig({
	default: {
		runner: "vitest",
		roots: {
			features: ["../.features"],
			steps: ["./src/steps", "./src/step-definitions.ts"],
			parameterTypes: ["./src/support/parameter-types.ts"],
		},
		test: {
			timeout: [30, "s"],
		},
	},
});
```

### 3. Enable the Autometa Vitest plugin

```ts title="vitest.config.ts"
import { defineConfig } from "vitest/config";
import { autometa } from "@autometa/vitest-plugins";

export default defineConfig({
	plugins: [autometa()],
	test: {
		environment: "node",
		include: ["../.features/**/*.feature"],
		hookTimeout: 30_000,
		testTimeout: 30_000,
	},
});
```

### 4. Run the features

Execute `pnpm vitest --run` or add `"features": "vitest run"` to stay in sync with the example.

</TabItem>

<TabItem value="playwright">

### 1. Install runner dependencies

```bash
pnpm add -D @playwright/test
pnpm add @autometa/playwright-executor @autometa/playwright-loader
```

### 2. Create `autometa.config.ts`

```ts title="autometa.config.ts"
import { defineConfig } from "@autometa/core/config";

export default defineConfig({
	default: {
		runner: "playwright",
		roots: {
			features: ["../.features"],
			steps: ["./src/autometa/steps.ts", "./src/steps/**/*.steps.*"],
			parameterTypes: ["./src/autometa/parameter-types.ts"],
		},
		test: {
			timeout: [30, "s"],
		},
	},
});
```

### 3. Point Playwright at the loader

```ts title="playwright.config.ts"
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./src",
	testMatch: "**/*.spec.ts",
	reporter: "list",
	use: {
		baseURL: process.env.BREW_BUDDY_BASE_URL ?? "http://localhost:4000",
		trace: "on-first-retry",
	},
	timeout: 30_000,
});
```

Add a lightweight spec (e.g., `src/features.spec.ts`) that imports each `.feature` you want to run. The loader transforms those imports into `test.describe` blocks, so you only maintain one Playwright entry point.

Wire the loader by importing `@autometa/playwright-loader/register` inside the spec (or set `NODE_OPTIONS="--import @autometa/playwright-loader/register"` when launching Playwright) so `.feature` imports compile correctly.

### 4. Run the features

Use the CLI to compile `.feature` files and execute them through Playwright:

```bash
pnpm autometa run
```

The CLI searches upward for `autometa.config.{ts,mts,cts,js,mjs,cjs}` or `autometa.<name>.config.*`.
Pass `-c/--config` to select a specific file when you maintain multiple configs.

### Playwright TypeScript/ESM notes

For smooth TS + ESM interop in Playwright projects, we recommend:

```json title="tsconfig.json"
{
	"compilerOptions": {
		"module": "ESNext",
		"moduleResolution": "Bundler"
	}
}
```

</TabItem>

</Tabs>

## Execute your suite

Regardless of the runner you pick, `@autometa/cli` keeps the entry point identical. It reads `autometa.config.ts`, resolves the step bundle you exported, and decides whether to hand execution off to Jest/VITEST or stay in the standalone runtime.

```bash
pnpm autometa run             # respects the feature roots from autometa.config.ts
pnpm autometa run --watch     # delegates to the native runner when available
pnpm autometa run --dry-run   # compile scenarios without exercising steps
pnpm autometa run --standalone # force the built-in runtime if you want to bypass Jest/Vitest
```

Pass `--config path/to/autometa.config.ts` when you maintain per-runner config files; otherwise the CLI grabs the file in your project root.

## Optional building blocks

### DTO builder for fixtures

```ts
import { DtoBuilder } from "@autometa/dto-builder";

interface CreateOrderDto {
	orderId: string;
	total: number;
	items: Array<{ sku: string; quantity: number }>;
}

const orderFactory = DtoBuilder.forInterface<CreateOrderDto>({
	defaults: {
		orderId: () => crypto.randomUUID(),
		total: 0,
		items: () => [],
	},
});

const order = await orderFactory
	.create()
	.items((list) => list.append({ sku: "sku-1", quantity: 2 }))
	.total((value) => value + 20)
	.assign("currency", "USD")
	.build();
```

Use the builder in world hooks or step definitions to keep fixtures deterministic across runners.

### Assertion plugins with `ensure(...)`

```ts
import {
	createEnsureFactory,
	ensure as baseEnsure,
	type AssertionPlugin,
} from "@autometa/assertions";
import {
	ensureHttp,
	type HttpEnsureChain,
	type HttpResponseLike,
} from "@autometa/http";

type World = { lastResponse?: HttpResponseLike };

const responsePlugin: AssertionPlugin<World, HttpEnsureChain<HttpResponseLike>> =
	({ ensure, isNot }) =>
	(world) => {
		const response = ensure
			.always(world.lastResponse, { label: "last response" })
			.toBeDefined().value;

		return ensureHttp(response, { label: "http response", negated: isNot });
	};

export const useEnsure = createEnsureFactory(baseEnsure, {
	response: responsePlugin,
});

const ensure = useEnsure(world);

ensure.response.toHaveStatus(200);
ensure.not.response.toHaveStatus(500);
```

Plugins let you attach domain helpers (API verifiers, database checks, schema matchers) directly to the assertion chain. Because the factory is world-aware, your facets transparently access shared context without leaking globals.
