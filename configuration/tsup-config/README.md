# TSUP Configuration

Shared TSUP configuration for Autometa packages.

## Usage

In your package's `tsup.config.ts`:

```typescript
import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  // Package-specific overrides
  // external: ["some-external-package"]
});
```

## Features

- **Dual format**: Generates both CommonJS and ESM builds
- **TypeScript declarations**: Automatically generates `.d.ts` files
- **Source maps**: Includes source maps for debugging
- **Tree shaking**: Optimized bundle sizes
- **External dependencies**: Common packages are marked as external
- **Clean builds**: Automatically cleans output directory

## Configuration Options

The `createTsupConfig` function accepts any valid TSUP options to override defaults:

```typescript
import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  // Override entry points
  entryPoints: ["src/index.ts", "src/cli.ts"],
  
  // Add external dependencies
  external: ["my-external-dep"],
  
  // Custom output directory
  outDir: "lib",
  
  // Enable code splitting
  splitting: true,
});
```

## Default Configuration

- **Format**: `["cjs", "esm"]`
- **Target**: `"es2020"`
- **Entry**: `["src/index.ts"]`
- **Output**: `"dist"`
- **Source maps**: Enabled
- **Declaration files**: Enabled
- **Tree shaking**: Enabled
- **Code splitting**: Disabled (for libraries)

## External Dependencies

The following packages are automatically marked as external:
- `react`
- `react-dom`
- `@types/node`
- `vitest`
- `typescript`
- Any additional externals you specify
