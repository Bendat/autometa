---
sidebar_position: 3
---

# CLI Reference

The `@autometa/cli` package provides the `autometa` command-line tool for running your tests.

## `autometa run`

Executes your feature files.

```bash
autometa run [options] [patterns...]
```

### Arguments

- `patterns`: Optional glob patterns to filter which feature files to run. If omitted, it uses the `roots.features` from your configuration.

### Options

| Option | Description |
| --- | --- |
| `--config <path>` | Path to the configuration file (overrides discovery). |
| `-e, --environment <environment>` | Select a named environment from `environments` in your config. |
| `-g, --group <group>` | Filter module groups to include (affects module/step loading; patterns are not auto-scoped). Repeatable. |
| `-m, --module <module>` | Filter modules to include (by id or unambiguous suffix; affects module/step loading; patterns are not auto-scoped). Repeatable. |
| `--dry-run` | Compiles the features and steps but does not execute the scenarios. Useful for checking for undefined steps. |
| `--watch` | Runs in watch mode. Only supported when using a native runner (Jest/Vitest). |
| `--standalone` | Forces the use of the built-in CLI runtime, bypassing Jest/Vitest even if configured. |
| `--verbose` | Enables verbose logging. |
| `--cache-dir <dir>` | Directory for the Autometa cache (defaults to `node_modules/.cache/autometa` when available). |
| `--handover` | Pass args after `--` directly to the detected native runner (vitest/jest/playwright). |

### Groups & Modules

Autometa can model monorepo-style suites using **groups** (e.g. apps) and **modules** (e.g. use-cases/bounded contexts).

- **Groups** select which step environments (world + app) are eligible to run a feature (via `CucumberRunner.builder().group("...")`).
- **Modules** are an optional config feature (`modules.relativeRoots`) that expands roots and allows targeted runs via `-m/-g`.
  - See [Getting Started → Monorepos](../getting-started/monorepos.md) for recommended layouts.

Module selectors accepted by `-m`:

- Exact: `<group>/<modulePath>` or `<group>:<modulePath>` (deep paths supported)
- Suffix: `<modulePath>` (must be unambiguous; use `-g` to disambiguate)

Feature scoping for step visibility (when `modules.stepScoping: "scoped"`):

- Features under a group/module directory are scoped by their file path.
- Hoisted features can opt into a scope via `@scope(<group>:<modulePath>)` (example: `@scope(backoffice:reports)`).
  - Hoisted scoping behavior is configurable via `modules.hoistedFeatures.scope`:
    - `"tag"` (default): hoisted features require `@scope(...)`
    - `"directory"`: infer scope from the feature’s directory under `roots.features`
  - `@scope(<group>)` assigns the feature to the group, but does not intentionally downgrade a module-inferred scope for features already under a module directory.

### Examples

Run all features:
```bash
autometa run
```

Run specific features:
```bash
autometa run "features/user/*.feature"
```

Run in watch mode (with Vitest/Jest):
```bash
autometa run --watch
```

Force standalone mode:
```bash
autometa run --standalone
```

Select an environment:
```bash
autometa run -e staging
```

Run a group:
```bash
autometa run -g backoffice
```

Run a module (unambiguous suffix):
```bash
autometa run -g backoffice -m reports
```

Run a deep module (exact id):
```bash
autometa run -m backoffice:orders:cancellations
```

Forward Playwright args to the native runner:
```bash
autometa run --handover -- --project=api --headed
```

### Config discovery, global installs, and custom names

The CLI locates your config by searching upward from the current directory for:

- `autometa.config.{ts,mts,cts,js,mjs,cjs}`
- `autometa.<name>.config.{ts,mts,cts,js,mjs,cjs}` (e.g. `autometa.e2e.config.ts`)

This works well with globally installed CLIs or when you run from a subfolder. Use `--config` to point at a specific file when you keep multiple configs.

### Runner detection and modes

If `runner` is not explicitly set (or set to `auto`-like behavior), the CLI detects a native runner based on project files:

- Vitest: presence of `vitest.config.*`
- Jest: presence of `jest.config.*`
- Playwright: presence of `playwright.config.*`

Modes:

- Default ("native"/"auto"): delegate to the detected runner when available
- `--standalone`: use the built-in runtime regardless of native runner presence

### Cache directory configuration

The CLI compiles TS modules (e.g., configs) into a cache directory. Defaults:

- `node_modules/.cache/autometa` when `node_modules` is present
- OS cache fallback otherwise

You can override via environment variables:

- `AUTOMETA_CACHE_DIR` – absolute or relative path to use as the cache dir
- `AUTOMETA_HOME` – base directory; the CLI writes a `cache/` subfolder under it
