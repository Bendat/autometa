---
sidebar_position: 1
---

# Configuration reference

`autometa.config.ts` is the single place where you describe feature roots, runner options, module selection, and environment overrides. The schema below matches what ships in v1 and mirrors the configuration used throughout `/examples`.

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
			support?: string[];
			// You can add custom root keys too (arrays of module paths/globs).
		},
		test?: {
			timeout?: [number, "ms" | "s" | "m"];
			tagFilter?: string;
		};
		// Optional monorepo helpers used by `autometa run -g/-m`
		modules?: { /* stepScoping, relativeRoots, groups, explicit */ };
		// Advanced runtime/compiler knobs
		shim?: unknown;
		events?: string[];
		builder?: unknown;
		logging?: { http?: boolean };
		reporting?: {
			hierarchical?: { bufferOutput?: boolean };
		};
	},
	environments?: { /* override blocks */ },
});
```

Use additional keys (e.g. `playwright`, `vitest`) when you need runner-specific overrides. The `default` block is always required and acts as the fallback for every environment.

## Field reference

| Field | Description |
| --- | --- |
| `runner` | One of `"jest"`, `"vitest"`, or `"playwright"`. Determines which executor is loaded. |
| `roots.features` | Glob(s) pointing at `.feature` files. Absolute or relative paths are supported. |
| `roots.steps` | Paths to TypeScript or JavaScript modules that register phrases/steps. Accepts individual files or directories. |
| `roots.parameterTypes` | Optional modules loaded before `roots.steps` (useful for shared parameter-type exports/helpers). Most projects just import parameter type definitions from their step bundle. |
| `roots.support` | Optional support modules loaded before `roots.steps` (helpers, shared setup, etc.). |
| `roots.<anything>` | Extra root buckets are allowed; each is an array of module paths/globs that will be loaded for side effects. |
| `test.timeout` | `[value, unit]` tuple that controls scenario timeout. Executors convert this to the host runner’s timeout format. |
| `test.tagFilter` | A tag expression (e.g., `@smoke and not @slow`) to filter scenarios. |
| `shim` | Optional module hooks/shims used by some runners (advanced). |
| `events` | Optional event listener modules to load for side effects; see [Events](./events). |
| `builder` | Optional build/transpile controls for the CLI compiler (advanced). |
| `logging.http` | Enables structured HTTP logging from `@autometa/http`. |
| `reporting.hierarchical.bufferOutput` | When `false`, streaming reporters flush immediately (handy during watch mode). |
| `modules` | Optional monorepo helpers for grouping and module selection (used by `autometa run -g/-m`). |

## Root load order (CLI)

In the standalone runtime, the CLI loads root modules in this order:

- `roots.parameterTypes`
- `roots.support`
- `roots.hooks`
- `roots.app`
- `roots.steps`

This is useful when you want to split “registration” modules (hooks, globals, polyfills) from your step bundle.

If you don't need the extra separation, keep everything in `roots.steps`.

## Multiple runner targets

The repository keeps one config file per runner (see `/examples/*/autometa.config.ts`). This keeps root paths and hook wiring specific to the host runner. If you want to drive the same features through multiple runners inside one project, create separate config files (e.g., `autometa.jest.config.ts`, `autometa.playwright.config.ts`) and point each runner or CLI invocation at the file you need.

## Modules (monorepos)

Use `modules` when you want:

- A registry of **groups** (often “apps” in an Nx/Nest monorepo).
- A list of **modules** within each group (often use-cases or bounded contexts).
- CLI selection via `autometa run -g <group> -m <module>`.
- Optional step visibility scoping via `modules.stepScoping: "scoped"`.
- For end-to-end setup patterns, see [Getting Started → Monorepos](../getting-started/monorepos.md).

Minimal example:

```ts title="autometa.config.ts"
export default defineConfig({
	default: {
		runner: "vitest",
		roots: {
			features: ["src/features/**/*.feature"], // hoisted features (optional)
			steps: ["src/autometa/root.steps.ts", "src/groups/**/autometa.steps.ts"],
		},
		modules: {
			stepScoping: "scoped",
			relativeRoots: {
				features: [".features/**/*.feature"],
				steps: ["steps/**/*.steps.ts"],
			},
			groups: {
				"brew-buddy": {
					root: "src/groups/brew-buddy",
					modules: ["menu", "orders"],
				},
				backoffice: {
					root: "src/groups/backoffice",
					modules: [{ name: "orders", submodules: ["cancellations"] }],
				},
			},
		},
	},
});
```

Selector forms for `-m/--module`:

- Exact: `backoffice:orders:cancellations` (or `backoffice/orders/cancellations`)
- Suffix (must be unambiguous): `orders:cancellations` (use `-g backoffice` to disambiguate)
