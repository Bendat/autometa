---
sidebar_position: 3
---

<!-- cSpell:disable -->
# Authoring executors & steps

Autometa scenarios run through a single executor surface that you shape inside your step bundle. The examples in `/examples/*-functions` and `/examples/*-decorators` all follow the same recipe:

1. Build a `CucumberRunner` instance that knows about your world, app composition root, assertion plugins, and parameter types.
2. Export the resulting `stepsEnvironment` so runners (and the CLI) can discover your Given/When/Then functions or decorator metadata.
3. Run those steps either through Jest, Vitest, or Playwright—or call the `autometa run` command directly.

## Configure the Autometa executor

```ts title="src/step-definitions.ts"
import { CucumberRunner } from "@autometa/runner";
import { brewBuddyWorldDefaults } from "./world";
import { CompositionRoot } from "./composition/brew-buddy-app";
import { brewBuddyPlugins } from "./utils/assertions";
import { brewBuddyParameterTypes } from "./support/parameter-types";

const runner = CucumberRunner.builder()
  .expressionMap<BrewBuddyExpressionTypes>() // optional strongly-typed cucumber expressions
  .withWorld(brewBuddyWorldDefaults) // supplies initial world state per scenario
  .app(CompositionRoot) // wires your composition root or app container
  .assertionPlugins(brewBuddyPlugins) // extends ensure(...)
  .parameterTypes(brewBuddyParameterTypes); // registers custom cucumber expressions

export const stepsEnvironment = runner.steps();
```

Every builder call is optional, but the combo above gives you the same ergonomics seen in the Brew Buddy examples:

- `expressionMap` narrows `{string}` expression captures with your own union types.
- `withWorld` passes a factory that produces scenario-scoped world objects.
- `app(...)` points to an `App.compositionRoot(...)` definition so each world has an `app` facade with memoized clients and services.
- `assertionPlugins` extends the `ensure(...)` chain with domain-specific helpers.
- `parameterTypes` registers the custom cucumber parameters you defined next to your steps.

Once you export `stepsEnvironment`, runners can destructure `Given`, `When`, `Then`, hook helpers, and `ensure`. Decorator-based projects also call `runner.bindingsTS()` to grab the decorator-aware `@Binding`, `@Injectable`, `@Inject`, etc.

## Run features with `autometa run`

The CLI lives in `@autometa/cli` and automatically chooses the best execution mode:

- If your project has Vitest or Jest configured, `autometa run` defers to that runner so you keep watch mode, snapshots, and familiar reporters.
- If no native runner is detected, the CLI falls back to the standalone runtime. It still respects `autometa.config.ts`, parameter types, and your step bundle.

Common commands:

```bash
pnpm autometa run                     # run everything listed under roots.features
pnpm autometa run "features/**/*.feature"   # limit to specific globs
pnpm autometa run --dry-run           # compile steps without executing
pnpm autometa run --watch             # watch mode (Vitest/Jest only)
pnpm autometa run --standalone        # force the built-in runtime
```

Pass `--config autometa.jest.config.ts` (or similar) if you keep multiple executor configs per runner. Otherwise the CLI automatically loads `autometa.config.ts` from the workspace root.

## Step authoring strategies

Autometa supports two complementary approaches. You can even mix them within the same project when migrating.

### Top-level function steps

Function-based projects (see `/examples/vitest-functions`) destructure the DSL directly:

```ts
import { Given, When, Then, ensure } from "../step-definitions";

When("I request the menu listing", async (world) => {
  await performRequest(world, "get", "/menu");
  world.app.memory.rememberMenuSnapshot(extractMenuItems(world));
});

Then("the menu should include the default drinks", (world) => {
  const snapshot = world.runtime.requireTable("horizontal");
  // world is always the last argument
});
```

Key facts:

- Arguments arrive in the order defined by your cucumber expression, followed by an optional `StepRuntimeHelpers` instance, and finally the `world`.
- Use arrow functions when you prefer explicit parameters.
- Use the `function` keyword if you want `this` bound to the world (see [function vs arrow](#choosing-function-vs-arrow-syntax)).

### Decorator-based steps

Decorator projects (see `/examples/vitest-decorators`) build classes that encapsulate steps and dependencies:

```ts
import { Binding, Given, When, Then, Inject, WORLD_TOKEN } from "../step-definitions";

@Binding()
export class MenuSteps {
  constructor(@Inject(WORLD_TOKEN) private readonly world: BrewBuddyWorld) {}

  @When("I request the menu listing")
  async requestMenuListing(): Promise<void> {
    await performRequest(this.world, "get", "/menu");
  }
}
```

`runner.bindingsTS()` exposes `@Binding`, `@Given`, `@When`, `@Then`, `@Injectable`, `@Inject`, and `@LazyInject`. Decorators are great when you want to co-locate helpers, share state through class fields, or lean on the decorator-friendly DI container.

## Dependency injection: composition root vs decorators

Autometa offers two DI layers and you can mix them:

| Approach | Where it lives | When to use |
| --- | --- | --- |
| **Composition root** (`App.compositionRoot`) | `src/composition/*` (see Brew Buddy) | Preferred for wiring services, HTTP clients, repositories, and other long-lived dependencies. Works in both function and decorator projects. |
| **Decorator DI** (`@Injectable`, `@Inject`, `@Binding`) | Step classes and helper services | Great for per-step dependencies, lazy world access via tokens, or when you want DI without defining a separate composition file. |

A composition root example:

```ts
import { App, WORLD_TOKEN } from "@autometa/runner";
import { Scope } from "@autometa/injection";

export const CompositionRoot = App.compositionRoot(BrewBuddyClient, {
  deps: [HTTP_CLIENT, BrewBuddyMemoryService],
  setup: (compose) => {
    compose.registerClass(BrewBuddyMemoryService, { scope: Scope.SCENARIO });
  },
  inject: {
    world: { token: WORLD_TOKEN },
  },
});
```

Decorator DI example:

```ts
@Injectable()
export class OrderBuilder {
  constructor(@Inject(WORLD_TOKEN) private readonly world: BrewBuddyWorld) {}
}
```

Use whichever keeps your project maintainable—composition roots for infrastructure, decorators for tactical helpers.

## World and app surfaces

- **World** (`world.ts`) holds scenario-scoped data, runtime helpers, aliases, and measurement metrics. Fields listed under `WORLD_INHERIT_KEYS` get copied across nested scopes.
- **App** is the instance returned by `App.compositionRoot` and is attached to `world.app`. It typically exposes HTTP clients, memory stores, stream managers, and other test doubles.

Ensure your world export is a function or object factory passed into `.withWorld(...)`, and keep DTO builders/assertions on the world or app to avoid refetching them every step.

## Parameters & custom expressions

Register advanced cucumber parameters by exporting a `ParameterTypeDefinition[]` next to your steps and passing it to `.parameterTypes(...)`:

```ts
import type { ParameterTypeDefinition } from "@autometa/cucumber-expressions";
import type { BrewBuddyWorld } from "../world";

export const brewBuddyParameterTypes: ParameterTypeDefinition<BrewBuddyWorld>[] = [
  {
    name: "menuRegion",
    pattern: /northwest|southwest|midwest/i,
    transform: (value) => normalizeRegion(String(value)),
  },
  {
    name: "menuSeasonal",
    pattern: /(true|false)/i,
    transform: (value) => /^true$/i.test(String(value)),
  },
];
```

Inside a transform you can read `context.world` to store derived state (see `examples/*/support/parameter-types.ts`).

## Choosing `function` vs arrow syntax

The runner binds `this` to the current world **only** for classic `function` declarations. Arrow functions preserve the lexical `this` (usually `undefined`) but keep the signature short.

| Syntax | How to access the world | When to use |
| --- | --- | --- |
| `function step(arg1) { /* use this */ }` | `this` is the world, and the last argument is still provided if you declare it. | When migrating legacy CucumberJS steps or whenever you prefer `this` for ergonomics. |
| `(arg1, world) => { ... }` | World is the last argument (after optional runtime helpers). `this` is untouched. | When you want explicit TypeScript types on the world parameter or prefer arrow functions. |

If your handler length indicates you expect the runtime helpers, Autometa automatically inserts `StepRuntimeHelpers` before the world argument. That means you can upscale a handler whenever you need direct table/file helpers without rewriting every step.

---

With these building blocks you can configure the executor, run it with `autometa run`, and choose the authoring style (functions or decorators) that best fits your team.

<!-- cSpell:enable -->
