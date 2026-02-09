---
sidebar_position: 8
---

# Assertion Plugins

Autometa's `ensure(...)` function can be extended with custom plugins. This allows you to create domain-specific assertions that are readable and reusable.

## Why Use Plugins?

- **Readability**: `ensure.response.toHaveStatus(200)` is clearer than `expect(response.status).toBe(200)`.
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
Then("it should be awesome", () => {
  ensure.custom.isAwesome();
});
```

Inside step handlers and hooks, `ensure` is already bound to the current world. Outside of execution (e.g. module scope utilities), call `ensure(world).custom.*` or use `createEnsureFactory(...)`.

### Using plugins from an `ensure(value)` chain

Plugin facets remain on the `ensure` facade (`ensure.custom.*`), not on `EnsureChain` values. When you need to bridge from a value chain into plugin assertions, use `tap(...)`:

```ts
ensure(items)
  .pluck("item")
  .tap((values, context) => {
    const plugin = context.isNot ? ensure.not.custom : ensure.custom;
    plugin.assertInventoryItems(values);
  })
  .each((item) => item.toBeTypeOf("string"));
```

`tap(...)` does not transform the chain value; it executes your callback and returns the same chain so you can keep chaining.

## Example: HTTP Response Plugin

Here is a real-world example of a plugin for asserting against HTTP responses.

```ts
import { ensureHttp, type HttpEnsureChain, type HttpResponseLike } from "@autometa/http";

const responsePlugin: AssertionPlugin<World, HttpEnsureChain<HttpResponseLike>> =
  ({ ensure, isNot }) =>
  (world) => {
    const response = ensure.always(world.lastResponse, { label: "last response" }).toBeDefined().value;
    return ensureHttp(response, { label: "http response", negated: isNot });
  };
```
