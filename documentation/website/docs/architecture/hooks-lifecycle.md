---
sidebar_position: 2
---

# Hooks & Lifecycle

Autometa provides a rich set of hooks to manage the lifecycle of your tests. These hooks allow you to execute code at specific points in the test execution process.

## Execution Order

The following diagram illustrates the order in which hooks are executed:

1.  **`BeforeAll`**: Runs once before any features are executed.
2.  **`BeforeFeature`**: Runs before each feature file.
3.  **`BeforeRule`**: Runs before each rule (if present).
4.  **`BeforeScenario`**: Runs before each scenario.
5.  **`BeforeStep`**: Runs before each step.
6.  **`Step Definition`**: The actual step logic.
7.  **`AfterStep`**: Runs after each step.
8.  **`AfterScenario`**: Runs after each scenario.
9.  **`AfterRule`**: Runs after each rule.
10. **`AfterFeature`**: Runs after each feature file.
11. **`AfterAll`**: Runs once after all features are executed.

## Hook Ordering

Hook ordering is determined by:

1. `order` (lower runs first for `Before*`, higher runs first for `After*`)
2. scope depth (more nested hooks run first for `Before*`, and last for `After*`)

By default, hooks have an order of `5`.

```ts
BeforeScenario("start a stub server", ({ world }) => {
  void world;
}).order(1);
```

You can also set `order` via the options object:

```ts
BeforeScenario(
  "start a stub server",
  ({ world }) => {
    void world;
  },
  { order: 1 }
);
```

## Hook Arguments

All hooks receive an object containing the `World` and other context information.

```ts
BeforeScenario(({ world, scope, metadata }) => {
  console.log(`Starting scenario: ${scope.name}`);
});
```

- **`world`**: The current scenario's world instance.
- **`scope`**: Information about the current scope (feature, scenario, etc.).
- **`metadata`**: Additional metadata about the hook execution.

## Registering Hooks

Hooks are exported from your step definitions file.

```ts
// src/step-definitions.ts
export const {
  BeforeAll,
  AfterAll,
  BeforeFeature,
  AfterFeature,
  BeforeScenario,
  AfterScenario,
  BeforeStep,
  AfterStep,
} = runner.steps();

BeforeScenario(({ world }) => {
  world.db.connect();
});

AfterScenario(({ world }) => {
  world.db.disconnect();
});
```

## Hook Tags (Metadata)

Hooks can be tagged for metadata/debugging purposes.

```ts
BeforeScenario(({ world }) => {
  world.db.seed();
}, { tags: ["@database"] });
```

Scenario selection is controlled via `test.tagFilter` in `autometa.config.ts`.

## Global Hooks

Global hooks (`BeforeAll`, `AfterAll`) are typically defined in a separate file and registered in `autometa.config.ts`.

```ts
// autometa.config.ts
export default defineConfig({
  default: {
    hooks: {
      beforeAll: ["./src/support/global-hooks.ts"],
    },
  },
});
```

```ts
// src/support/global-hooks.ts
export const beforeAll = async () => {
  await startServer();
};
```
