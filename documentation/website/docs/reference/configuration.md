---
sidebar_position: 1
---

# Configuration reference

`autometa.config.ts` is the single place where you describe feature roots, hook scopes, providers, and runner overrides. The schema below matches what ships in v1 and mirrors the configuration used throughout `/examples`.

## Top-level shape

```ts title="autometa.config.ts"
import { defineConfig } from "@autometa/config";

export default defineConfig({
	default: {
		runner: "jest" | "vitest" | "playwright",
		roots: {
			features: string[];
			steps: string[];
			parameterTypes?: string[];
		},
		test?: {
			timeout?: [number, "ms" | "s" | "m"];
			tagFilter?: string;
		};
		logging?: { http?: boolean };
		reporting?: {
			hierarchical?: { bufferOutput?: boolean };
		};
		hooks?: {
			beforeAll?: string[];
			afterAll?: string[];
			beforeEach?: string[];
			afterEach?: string[];
		};
		providers?: Record<string, string>;
	},
	playwright?: { /* override example */ },
});
```

Use additional keys (e.g. `playwright`, `vitest`) when you need runner-specific overrides. The `default` block is always required and acts as the fallback for every environment.

## Field reference

| Field | Description |
| --- | --- |
| `runner` | One of `"jest"`, `"vitest"`, or `"playwright"`. Determines which executor is loaded. |
| `roots.features` | Glob(s) pointing at `.feature` files. Absolute or relative paths are supported. |
| `roots.steps` | Paths to TypeScript or JavaScript modules that register phrases/steps. Accepts individual files or directories. |
| `roots.parameterTypes` | Optional modules that call `defineParameterType`. Useful when reusing phrase vocabularies across runners. |
| `test.timeout` | `[value, unit]` tuple that controls scenario timeout. Executors convert this to the host runner’s timeout format. |
| `test.tagFilter` | A tag expression (e.g., `@smoke and not @slow`) to filter scenarios. |
| `logging.http` | Enables structured HTTP logging from `@autometa/http`. |
| `reporting.hierarchical.bufferOutput` | When `false`, streaming reporters flush immediately (handy during watch mode). |
| `hooks` | Arrays of module paths that export lifecycle hooks. Each module should export the corresponding hook function (e.g., `export const beforeAll = () => { ... }`). |
| `providers` | Named provider modules to register with the injector. Values should export a default factory that receives the current world. |

## Hook modules

Hook files mirror the keys inside `hooks`. A minimal example:

```ts title="src/support/hooks.ts"
import type { World } from "./world";

export const beforeAll = async (world: World) => {
	await world.http.start();
};

export const afterEach = (world: World) => {
	world.mocks.reset();
};
```

Register that module by adding `hooks: { beforeAll: ["./src/support/hooks.ts"], afterEach: ["./src/support/hooks.ts"] }` to the config.

## Providers and worlds

Providers give names to world factories. Inside `providers`, map a key to a module path:

```ts
providers: {
	apiClient: "./src/providers/api-client.ts",
}
```

Each provider module should `export default function create(world) { ... }`. The returned value becomes available on the world via `world.apiClient` (camel-cased name). Use this to expose DTO builders, HTTP clients, database pools, or ensure factories.

## Multiple runner targets

The repository keeps one config file per runner (see `/examples/*/autometa.config.ts`). This keeps root paths and hook wiring specific to the host runner. If you want to drive the same features through multiple runners inside one project, create separate config files (e.g., `autometa.jest.config.ts`, `autometa.playwright.config.ts`) and point each runner or CLI invocation at the file you need.
