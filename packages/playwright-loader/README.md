# @autometa/playwright-loader

Node.js module loader hooks for transforming `.feature` files into Playwright test suites.

## Overview

This package provides the infrastructure to run Gherkin feature files directly with Playwright by leveraging Node.js customization hooks to transform `.feature` imports on-the-fly.

## Installation

```bash
pnpm add @autometa/playwright-loader @playwright/test
```

## Usage

### Option 1: Import in playwright.config.ts

```typescript
import '@autometa/playwright-loader/register';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '**/*.feature',
});
```

### Option 2: Use with NODE_OPTIONS

```bash
NODE_OPTIONS="--import @autometa/playwright-loader/register" npx playwright test
```

### Option 3: Use with autometa CLI

```typescript
// autometa.config.ts
import { defineConfig } from '@autometa/app';

export default defineConfig({
  runner: 'playwright',
  roots: {
    features: ['features'],
    steps: ['steps'],
  },
});
```

Then run:

```bash
pnpm autometa run
```

## How It Works

1. **Node.js Module Hooks**: The loader uses Node.js's `module.register()` API to intercept `.feature` file imports.

2. **Resolve Hook**: When a `.feature` file is imported, the resolve hook marks it with a custom format.

3. **Load Hook**: The load hook transforms the `.feature` content into a Playwright test module:
   - Parses the Gherkin content
   - Loads step definitions from `autometa.config.ts`
   - Generates `test.describe()` and `test()` blocks

4. **Playwright Integration**: The generated code uses Playwright's fixtures (`page`, `context`, etc.) and assertions.

## Requirements

- Node.js 18.19+ or 20.6+ (for module customization hooks)
- Playwright 1.40+
- TypeScript (recommended)

## Architecture

```
.feature file import
        │
        ▼
┌───────────────────┐
│   resolve hook    │ ← Intercepts .feature specifiers
└───────────────────┘
        │
        ▼
┌───────────────────┐
│    load hook      │ ← Transforms to Playwright test code
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Playwright test  │ ← Native execution with fixtures
└───────────────────┘
```

## License

MIT
