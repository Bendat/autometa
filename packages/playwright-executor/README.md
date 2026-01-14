# @autometa/playwright-executor

Playwright executor for Autometa - provides runtime bindings that map Playwright's test primitives to Autometa's executor interface.

## Overview

This package provides an `ExecutorRuntime` implementation for Playwright that allows Autometa to execute Gherkin feature files using Playwright's test runner.

## Usage

This package is typically used internally by `@autometa/playwright-loader` but can be used directly:

```typescript
import { execute } from '@autometa/playwright-executor';
import { coordinateRunnerFeature } from '@autometa/runner';
import { parseGherkin } from '@autometa/gherkin';

// Parse your feature file
const feature = parseGherkin(featureContent);

// Coordinate the runner
const { plan, adapter } = coordinateRunnerFeature({
  feature,
  environment: stepsEnvironment,
  config: resolvedConfig
});

// Execute with Playwright runtime
execute({ plan, adapter, config: resolvedConfig });
```

## Runtime Mapping

The executor maps Autometa's execution primitives to Playwright's test API:

| Autometa          | Playwright           |
|-------------------|----------------------|
| `suite()`         | `test.describe()`    |
| `test()`          | `test()`             |
| `beforeAll()`     | `test.beforeAll()`   |
| `afterAll()`      | `test.afterAll()`    |
| `beforeEach()`    | `test.beforeEach()`  |
| `afterEach()`     | `test.afterEach()`   |

## License

MIT
