---
sidebar_position: 5
---

# Migrating to v1

Autometa v1 introduces a unified runner architecture and a new configuration system. This guide outlines the key changes and how to migrate your existing projects.

## 1. Configuration

The `autometa.config.ts` file is now the central place for configuration. It replaces previous configuration methods.

```ts
import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest", // or "jest", "playwright"
    roots: {
      features: ["./features"],
      steps: ["./src/steps"],
    },
  },
});
```

## 2. Runner Setup

The `CucumberRunner` class is now the standard way to configure your test environment, replacing disparate setup methods.

```ts
import { CucumberRunner } from "@autometa/runner";

const runner = CucumberRunner.builder()
  .withWorld(worldFactory)
  .app(CompositionRoot)
  .steps();

export const { Given, When, Then } = runner;
```

## 3. Assertions

The `ensure` API is now the primary way to perform assertions, with support for custom plugins.

```ts
import { ensure } from "./step-definitions";

ensure(value).toBe(expected);
```

## 4. Package Structure

Core functionality has been split into focused packages:
- `@autometa/runner`: Core runner logic.
- `@autometa/scopes`: Scope management.
- `@autometa/assertions`: Assertion library.
- `@autometa/dto-builder`: Data builder.

Ensure you have the correct dependencies installed.

```bash
pnpm add @autometa/runner @autometa/scopes @autometa/assertions
```
