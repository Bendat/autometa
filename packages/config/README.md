# @autometa/config

Environment-aware configuration utilities for Autometa executors. This package
exposes a schema-backed `defineConfig` helper that resolves the active
environment, merges overrides, and provides an immutable configuration object
to downstream runners.

## Quick start

```ts
import { defineConfig } from "@autometa/config";

export const config = defineConfig({
	default: {
		runner: "vitest",
		roots: {
			features: ["features"],
			steps: ["steps"],
		},
	},
	environments: {
		ci: {
			test: {
				timeout: { value: 30, unit: "s" },
			},
		},
	},
	environment: (env) => env.byEnvironmentVariable("AUTOMETA_ENV"),
});

const { config: resolved } = config.resolve();
```

See `src/config.ts` and the unit tests under `src/__tests__` for more usage
examples.