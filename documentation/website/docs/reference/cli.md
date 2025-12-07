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
| `--dry-run` | Compiles the features and steps but does not execute the scenarios. Useful for checking for undefined steps. |
| `--watch` | Runs in watch mode. Only supported when using a native runner (Jest/Vitest). |
| `--standalone` | Forces the use of the built-in CLI runtime, bypassing Jest/Vitest even if configured. |
| `--verbose` | Enables verbose logging. |

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
