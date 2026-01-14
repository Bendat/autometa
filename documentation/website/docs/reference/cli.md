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
| `--config <path>` | Path to the configuration file. Defaults to `autometa.config.ts`. |
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
