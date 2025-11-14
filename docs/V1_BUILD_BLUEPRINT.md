# Autometa v1 Build Blueprint

This document captures the agreed "single source of truth" for how the Autometa repository is built, lint-checked, tested and packaged as we graduate the v1 rewrite from alpha to a stable release. Treat this as the canonical reference when adding new packages, debugging pipeline issues, or configuring CI. Any deviation should be justified and recorded here.

---

## 1. Goals
- **Deterministic builds**: every package produces CJS, ESM and type outputs from a single toolchain with locked task ordering.
- **Single entry point**: contributors run the same top-level `pnpm` scripts; packages expose the same script surface.
- **Fast feedback**: type-check and tests run without requiring bundles; builds leverage Turbo caching and TS project references.
- **Scalable**: adding a package means copying the standard template and wiring dependencies; automation fills in the rest.
- **Observable**: CI can rely on a predictable matrix (lint → type-check → unit tests → integration tests → build → publish dry-run).

---

## 2. Toolchain Baseline
| Tool | Version | Notes |
| ---- | ------- | ----- |
| Node | 20 LTS (20.11+) | Required for decorators metadata, native fetch and `ts-node` ESM stability. Update `volta` pin as part of rollout. |
| `pnpm` | 9.x (matches `packageManager`) | `preinstall` keeps everyone aligned. |
| TypeScript | 5.5+ | Unlocks faster project references and `--moduleResolution bundler`. |
| Turbo | 2.5+ | Provides pipeline + remote caching. |
| `tsup` | 8.x | Supports stable `outExtension` options and TS5 emit.|
| `vitest` | 1.6+ | Core test runner for packages. |
| `eslint` | 9.x | Use flat config once migration complete; until then, keep legacy config but upgrade rules. |

> Upgrade order: TypeScript → `tsup` → `eslint` stack → `vitest`. Do a single lock-file update once all manifests match the target versions.

---

## 3. Workspace Layout
```
autometa/
├── configuration/        # Consumable shared config packages
│   ├── tsconfig/         # TS project schemas
│   └── tsup-config/      # tsup factory + helpers
├── packages/             # Publishable libraries (npm scope @autometa/*)
├── __integration__/      # Cross-package integration and legacy migration tests
├── docs/, documentation/ # Developer guides, migration notes
├── scripts/              # Automation (e.g. TypeScript reference sync)
└── turbo/                # Generators, presets, CI helpers
```

Keep configuration packages private and versioned. Only `packages/*` (and future `apps/*`) should publish artifacts.

---

## 4. Root `package.json` Scripts
All developer entry points run through Turbo so caching and dependency graphs apply uniformly.

```jsonc
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "postinstall": "pnpm sync-ts-references",
    "sync-ts-references": "node scripts/update-ts-references.mjs",

    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "type-check": "turbo run type-check",
    "type-check:watch": "turbo run type-check --watch",

    "test": "turbo run test --filter='!@autometa/documentation'",
    "test:watch": "turbo run test -- --watch",
    "test:integration": "turbo run test:integration",
    "coverage": "turbo run coverage",

    "build": "turbo run build",
    "build:types": "turbo run build:types",
    "build:docs": "turbo run build:docs",

    "dev": "turbo run dev",
    "clean": "turbo run clean",

    "verify": "turbo run verify:packages",
    "release:prepare": "pnpm changeset version",
    "release": "pnpm verify && changeset publish"
  }
}
```

- `postinstall` always refreshes TS references so project references stay in sync.
- `verify` is the CI entry point (lint → type-check → test → build). Documentation projects are filtered out of `test` by default.

---

## 5. Turbo Task Graph (`turbo.json`)
```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["env"],
  "tasks": {
    "lint": {
      "inputs": [
        "src/**/*.{ts,tsx,js,jsx}",
        "eslint.config.*",
        ".eslintrc.*",
        "package.json"
      ]
    },
    "lint:fix": { "cache": false, "dependsOn": ["lint"] },

    "type-check": {
      "dependsOn": ["^build:types"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "tsconfig.dev.json", "package.json"],
      "outputs": ["tsconfig.dev.tsbuildinfo"],
      "env": ["TS_NODE_PROJECT"]
    },

    "build:types": {
      "dependsOn": ["^build:types"],
      "inputs": ["src/**/*.ts", "tsconfig.types.json"],
      "outputs": ["dist/types/**", "tsconfig.types.tsbuildinfo"]
    },

    "build": {
      "dependsOn": ["type-check", "build:types", "^build"],
      "inputs": [
        "src/**/*",
        "tsup.config.ts",
        "package.json",
        "tsconfig.build.json"
      ],
      "outputs": ["dist/esm/**", "dist/cjs/**", "dist/index.*"]
    },

    "dev": { "dependsOn": ["^build"], "cache": false, "persistent": true },

    "test": {
      "dependsOn": ["type-check"],
      "inputs": ["src/**/*", "vitest.config.*", "package.json"],
      "outputs": ["coverage/**"],
      "env": ["VITEST_SEGFAULT_RETRY"]
    },

    "coverage": { "dependsOn": ["type-check"], "outputs": ["coverage/**"] },

    "test:integration": {
      "dependsOn": ["build"],
      "inputs": ["integration/**/*", "vitest.integration.config.*", "jest.integration.config.*"]
    },

    "build:docs": {
      "cache": false,
      "dependsOn": ["^build"],
      "outputs": ["build/**", ".docusaurus/**"]
    },

    "clean": { "cache": false },

    "verify:packages": {
      "cache": false,
      "dependsOn": ["sync-ts-references", "lint", "type-check", "test", "build"]
    },

    "sync-ts-references": {
      "cache": false,
      "inputs": ["packages/*/package.json", "packages/*/tsconfig.types.json"],
      "outputs": ["tsconfig.json"]
    }
  }
}
```

Adjust paths to include `libraries/*` if/when that folder rejoins the workspace.

---

## 6. Package Contract
Every library under `packages/*` must meet the same expectations.

### 6.1 `package.json`
```jsonc
{
  "type": "module",
  "main": "dist/cjs/index.cjs",
  "module": "dist/esm/index.js",
  "types": "dist/types/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "type-check": "tsc --noEmit -p tsconfig.dev.json",
    "type-check:watch": "tsc --noEmit -w -p tsconfig.dev.json",
    "build": "tsup --config tsup.config.ts",
    "build:types": "tsc --build tsconfig.types.json",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest --passWithNoTests",
    "coverage": "vitest run --coverage --passWithNoTests",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "clean": "rimraf dist"
  },
  "exports": {
    "." : {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "default": "./dist/esm/index.js"
    }
  }
}
```
- `files` restricts publishable artifacts.
- Use `workspace:*` ranges for all internal dependencies (`@autometa/*`, `configuration/*`).
- Keep devDependencies minimal: `typescript`, `vitest`, `eslint-config-custom`, `tsup-config`.

### 6.2 TypeScript configs
- `tsconfig.dev.json` extends `configuration/tsconfig/package.config.json`.
- `tsconfig.build.json` extends `configuration/tsconfig/package.build.json`.
- `tsconfig.types.json` extends `tsconfig.build.json` and toggles `emitDeclarationOnly`.
- `tsconfig.json` is a thin wrapper pointing to `tsconfig.dev.json` (for editor compatibility).

```jsonc
// tsconfig.dev.json
{
  "extends": "tsconfig/package.config.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "**/*.spec.ts", "**/*.test.ts"]
}

// tsconfig.build.json
{
  "extends": "tsconfig/package.build.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts"]
}

// tsconfig.types.json
{
  "extends": "./tsconfig.build.json",
  "compilerOptions": {
    "composite": true,
    "emitDeclarationOnly": true,
    "declarationDir": "./dist/types",
    "tsBuildInfoFile": "./tsconfig.types.tsbuildinfo",
    "paths": {
      "@autometa/*": ["../*/dist/types/index.d.ts"]
    }
  },
  "references": []
}
```
`update-ts-references.mjs` populates the `references` array automatically.

### 6.3 `tsup.config.ts`
```ts
import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.build.json",
  dts: false, // declarations are emitted via the build:types task
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  outDir: "dist",
  outExtension: ({ format }) => (format === "cjs" ? { js: ".cjs" } : { js: ".js" }),
  clean: true,
  external: [/^@autometa\//]
});
```
- `outExtension` guarantees `dist/cjs/index.cjs` vs `dist/esm/index.js` alignment with `package.json`.
- Keep additional externals minimal; prefer relying on consumers to provide their own dependencies.

### 6.4 Testing
- Package-level tests live under `src/__tests__` or alongside the units.
- Use the shared `vitest.config.ts` for defaults; add local overrides via `vitest.workspace.ts` if necessary.
- Integration suites should live under `__integration__/` and register Turbo tasks via package-specific configs.

---

## 7. Shared Config Packages

### 7.1 `configuration/tsconfig`
- `base.json`: baseline used by tooling (`moduleResolution`, strict flags, no emit by default).
- `package.config.json`: extends base with bundler-friendly options and path aliases.
- `package.build.json`: same as config but rewires `paths` to point at `dist` outputs so bundling resolves built artifacts.
- Export all three in `package.json` so packages can `extends "tsconfig/package.build.json"` without relative hops.

### 7.2 `configuration/tsup-config`
- Provide a factory that merges repo defaults with per-package overrides.
- Defaults include: `format`, `sourcemap`, `treeshake`, `skipNodeModulesBundle`, `target`, `clean`.
- Keep `dts: false` by default; packages only re-enable if they opt out of the `build:types` pipeline.

### 7.3 `configuration/eslint-config-custom`
- Upgrade to ESLint 9 flat config when feasible; until then, keep compat export so packages run `eslint .`.
- Require `eslint-config-turbo` in CI to enforce task dependency correctness.
- Expand ignore patterns to include generated `dist`, `.docusaurus`, and `coverage` directories.

---

## 8. Automation & Quality Gates
1. **TypeScript references**: `pnpm sync-ts-references` runs after install and inside CI before `type-check`.
2. **Pre-commit (optional)**: configure lefthook or lint-staged to run `pnpm lint` + `pnpm test --filter $(changed package)`.
3. **Changesets**: release automation continues to rely on `pnpm release` after `verify` passes.
4. **CI pipeline** (GitHub Actions / Buildkite):
   1. Install (pnpm fetch → pnpm install)
   2. `pnpm verify`
   3. `pnpm test:integration`
   4. `pnpm build` (to assert caches not skipped)
   5. Optional: `pnpm changeset status --verbose`

---

## 9. Migration Checklist
1. **Upgrade toolchain** versions in root `package.json` and shared config packages.
2. **Fix root tsconfig references** (`tsconfig.base.json` should extend `configuration/tsconfig/base.json`).
3. **Update shared tsup factory** to default `dts: false` and apply `outExtension`.
4. **Normalize package manifests** using the template in §6.1; remove stray scripts (`prettify`, custom watchers`).
5. **Re-run `pnpm sync-ts-references`**; commit updated `tsconfig.types.json` files.
6. **Validate pipeline**:
   - `pnpm lint`
   - `pnpm type-check`
   - `pnpm test`
   - `pnpm build`
   - `pnpm test:integration`
7. **Update CI configuration** to call `pnpm verify` followed by `pnpm release --tag next` (for dry runs).

Document deviations or package-specific needs in their respective READMEs to keep this blueprint lightweight.

---

## 10. FAQ
- **Q: Can a package skip `tsup`?** Only if it is purely types (e.g. `@autometa/types`). In that case set `build` to `pnpm build:types` and mark the package in Turbo with `env.TSUP_DISABLED=true`.
- **Q: How do we add a new package?** Run `pnpm turbo:gen library`, align the generated files with §6, add dependencies, run `pnpm install`, `pnpm sync-ts-references`, then ship.
- **Q: How are integration suites wired?** Place them under `__integration__/jest-integration` (for Jest) or create workspace-specific `vitest.integration.config.ts`. Ensure Turbo `test:integration` depends on `build` to consume bundled outputs.
- **Q: What about documentation apps?** They live under `documentation/website` and opt out of the default `test` target using Turbo filters (`--filter='!@autometa/documentation'`).

---

By keeping this blueprint authoritative we avoid "whack-a-mole" fixes—any future change to the build surface must update this document and the corresponding shared configuration package.
