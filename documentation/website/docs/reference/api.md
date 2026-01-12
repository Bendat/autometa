---
sidebar_position: 2
---

# API Reference

## CucumberRunner

The `CucumberRunner` class is the entry point for configuring your test environment. It uses a builder pattern to compose your world, application, and assertion plugins.

### `CucumberRunner.builder()`

Creates a new `RunnerBuilder` instance.

```ts
import { CucumberRunner } from "@autometa/runner";

const runner = CucumberRunner.builder();
```

### `RunnerBuilder` Methods

#### `.withWorld(factory)`

Defines the world factory used to create worlds for execution scopes.

- **factory**: A function or class that returns the world object.
- **Returns**: A new builder instance typed with the new world.

```ts
runner.withWorld(() => ({ count: 0 }));
```

Notes:

- A fresh **scenario world** is always created per scenario.
- Autometa may also create **feature/rule/scenario-outline** worlds when you register hooks for those scopes (`BeforeFeature`, `BeforeRule`, `BeforeScenarioOutline`, etc.).
- When a higher-scope world exists, the next nested scope receives it as `context.parent` in your world factory.

If you want selected values copied from the parent world into the child world, opt-in via `WORLD_INHERIT_KEYS`:

```ts
import { WORLD_INHERIT_KEYS } from "@autometa/runner";

runner.withWorld({
  baseUrl: "",
  [WORLD_INHERIT_KEYS]: ["baseUrl"],
});
```

#### `.app(compositionRoot)`

Registers an application composition root. This is useful for dependency injection and managing shared services.

- **compositionRoot**: A class or factory function that creates your application container.
- **Returns**: A new builder instance where the world has an `app` property.

```ts
runner.app(CompositionRoot);
```

#### `.assertionPlugins(plugins)`

Registers custom assertion plugins for `ensure(...)`.

- **plugins**: An object where keys are plugin names and values are plugin factories.
- **Returns**: A new builder instance with the plugins available on `ensure`.

```ts
runner.assertionPlugins({
  myPlugin: (world) => (actual) => ({
    toBeAwesome: () => console.log(actual, "is awesome"),
  }),
});
```

#### `.parameterTypes(definitions)`

Registers custom Cucumber parameter types.

- **definitions**: A function that receives a `defineParameterType` helper.

```ts
runner.parameterTypes((define) => {
  define({
    name: "color",
    regexp: /red|blue|green/,
    transformer: (s) => s.toUpperCase(),
  });
});
```

#### `.steps()`

Finalizes the configuration and returns the steps environment. This object contains `Given`, `When`, `Then`, hooks, and `ensure`.

```ts
export const { Given, When, Then } = runner.steps();
```

#### `.bindingsTS()`

Returns the decorator-based environment for use with TypeScript experimental decorators.

```ts
export const { Binding, Given, When, Then } = runner.bindingsTS();
```

## DtoBuilder

`DtoBuilder` provides a fluent interface for creating test data objects (DTOs) with default values and overrides.

### `DtoBuilder.forInterface<T>(options)`

Creates a builder factory for an interface.

- **options**:
  - `defaults`: An object defining default values or factories for properties.

```ts
import { DtoBuilder } from "@autometa/dto-builder";

interface User {
  id: string;
  name: string;
}

const userBuilder = DtoBuilder.forInterface<User>({
  defaults: {
    id: () => crypto.randomUUID(),
    name: "Anonymous",
  },
});

const user = userBuilder.create().name("Alice").build();
```

### `DtoBuilder.forClass(constructor, options)`

Creates a builder factory for a class. It respects `@Builder` decorators on the class.

- **constructor**: The class constructor.
- **options**: Same as `forInterface`.

```ts
class User {
  id: string;
  name: string;
}

const userBuilder = DtoBuilder.forClass(User);
```

## ensure

The `ensure` function is the entry point for assertions. It can be extended with plugins.

```ts
import { ensure } from "./step-definitions";

ensure(value).toBe(expected);
```

### Built-in Assertions

(List some common assertions here if available, or link to `@autometa/assertions` docs if they exist separately)

## StepRuntimeHelpers (docstrings, tables, metadata)

Steps can access runtime helpers via `world.runtime`, which provides access to docstrings, tables, and step metadata.

```ts
import { Given } from "./step-definitions";

Given("the request payload is defined", (world) => {
  world.state.payload = world.runtime.consumeDocstringTransformed();
});
```

Docstring media types (text block types) are preserved and can be transformed via `configureStepDocstrings`:

```ts
import { configureStepDocstrings } from "@autometa/runner";

configureStepDocstrings({
  transformers: {
    json: (raw) => JSON.parse(raw),
  },
});
```

Full reference and examples: see `documentation/website/docs/reference/step-runtime.md:1`.
