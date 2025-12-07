---
sidebar_position: 7
---

# Assertion Plugins

Autometa's `ensure(...)` function can be extended with custom plugins. This allows you to create domain-specific assertions that are readable and reusable.

## Why Use Plugins?

- **Readability**: `ensure(response).hasStatus(200)` is clearer than `expect(response.status).toBe(200)`.
- **Reusability**: Encapsulate complex checks in a single method.
- **Context Awareness**: Plugins have access to the `World` object, so they can assert against shared state.

## Creating a Plugin

A plugin is a factory function that receives the `ensure` instance and returns a function that accepts the `World`. This function then returns your custom assertion methods.

```ts
import { AssertionPlugin } from "@autometa/assertions";

interface MyAssertions {
  isAwesome(): void;
}

const myPlugin: AssertionPlugin<MyWorld, MyAssertions> = ({ ensure }) => (world) => {
  return {
    isAwesome() {
      const value = world.someValue;
      ensure(value).toBe("awesome");
    },
  };
};
```

## Registering Plugins

Register your plugins with the `CucumberRunner`.

```ts
// src/step-definitions.ts
import { CucumberRunner } from "@autometa/runner";

const plugins = {
  custom: myPlugin,
};

const runner = CucumberRunner.builder()
  .assertionPlugins(plugins)
  // ...
```

## Using Plugins

Once registered, your plugins are available on the `ensure` object returned by the runner.

```ts
// src/step-definitions.ts
export const { ensure } = runner.steps();

// In a step definition
Then("it should be awesome", (world) => {
  ensure(world).custom.isAwesome();
});
```

## Example: HTTP Response Plugin

Here is a real-world example of a plugin for asserting against HTTP responses.

```ts
const responsePlugin: AssertionPlugin<World, ResponseAssertions> = ({ ensure }) => (world) => {
  return {
    hasStatus(expected: number) {
      const response = world.lastResponse;
      ensure(response.status).toBe(expected);
    },
    hasHeader(name: string, value: string) {
      const response = world.lastResponse;
      ensure(response.headers.get(name)).toBe(value);
    },
  };
};
```
