---
sidebar_position: 4
---

# Authoring executors & steps

<!-- cSpell:disable -->
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

```ts title="src/step-definitions.ts"
export const stepsEnvironment = runner.steps();

export const { Given, When, Then, ensure } = stepsEnvironment;
```

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

- Function steps register immediately when the module is imported (that’s why `roots.steps` must point at your step bundle).
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

Decorator steps are collected via metadata, so the main difference is *where registration happens*: you decorate classes/methods, then the runner discovers those bindings when it builds the environment.

## Detailed step inputs (tables, docstrings, runtime metadata)

Autometa steps can optionally receive a **runtime helpers** argument that exposes tables, docstrings, and step metadata. You can also access the same helpers through `world.runtime`. These helpers are per-step and read-only; they are re-bound on each step execution.

### Step runtime helpers (`StepRuntimeHelpers`)

If your step signature includes an extra parameter after the expression args, Autometa injects a `StepRuntimeHelpers` instance before the world:

```ts title="src/steps/flight.steps.ts"
import type { StepRuntimeHelpers } from "@autometa/executor";
import { Given } from "../step-definitions";

Given("the flight is ready to board", (runtime: StepRuntimeHelpers, world) => {
  if (runtime.hasDocstring) {
    world.state.note = runtime.consumeDocstring();
  }
});
```

Expression arguments still come first. The runtime helper always sits just before the world:

```ts title="src/steps/flight.steps.ts"
import type { StepRuntimeHelpers } from "@autometa/executor";
import { When } from "../step-definitions";

When("the flight has {int} passengers", (count: number, runtime: StepRuntimeHelpers, world) => {
  world.state.passengerCount = count;
  world.state.sourceLine = runtime.currentStep?.step?.source?.line ?? null;
});
```

When you prefer not to add the extra parameter, read the same helpers from `world.runtime`:

```ts title="src/steps/flight.steps.ts"
import { When } from "../step-definitions";

When("the gate is assigned", (world) => {
  const table = world.runtime?.getTable("horizontal");
  world.state.gate = table?.getRow(0)?.gate ?? "A1";
});
```

`world.runtime` is a non-enumerable, per-step view that is attached on demand. Avoid storing it outside the step or hook that receives it. In hooks, `runtime.currentStep` may be `undefined` (there is no step yet).

### Docstrings

Docstrings are attached to a step in Gherkin using triple quotes:

```gherkin
Given the manifest is recorded
  """
  flight: SP-102
  captain: Aster
  """
```

Access them via `getDocstring()` or `consumeDocstring()`:

```ts title="src/steps/manifest.steps.ts"
import { Given } from "../step-definitions";

Given("the manifest is recorded", (runtime, world) => {
  const raw = runtime.getDocstring();
  if (!raw) return;
  world.state.manifest = raw.trim().split("\n");
});
```

`consumeDocstring()` clears the docstring so downstream steps do not accidentally reuse it.

#### Docstring media types (text block types)

Gherkin docstrings can declare a media type (sometimes called a “docstring content type” or “text block type”) immediately after the opening delimiter:

```gherkin
Given the request payload is defined
  \"\"\"json
  { \"priority\": \"high\", \"route\": \"orbital\" }
  \"\"\"
```

Autometa preserves that media type and exposes it via `runtime.getDocstringMediaType()` / `runtime.getDocstringInfo()`.

If you register docstring transformers, you can also parse docstrings automatically based on that media type:

```ts title="src/step-definitions.ts"
import { configureStepDocstrings } from "@autometa/runner";

configureStepDocstrings({
  transformers: {
    json: (raw) => JSON.parse(raw),
    "application/json": (raw) => JSON.parse(raw),
  },
});
```

```ts title="src/steps/payload.steps.ts"
import { Given } from "../step-definitions";

Given("the request payload is defined", (runtime, world) => {
  world.state.payload = runtime.consumeDocstringTransformed();
});
```

If you want to parse structured payloads, do it explicitly:

```gherkin
Given the payload is prepared
  """
  { "priority": "high", "route": "orbital" }
  """
```

```ts title="src/steps/payload.steps.ts"
import { Given } from "../step-definitions";

Given("the payload is prepared", (runtime, world) => {
  const raw = runtime.consumeDocstring();
  world.state.payload = raw ? JSON.parse(raw) : null;
});
```

### Data tables

Tables are attached to steps directly under the step text:

```gherkin
When the crew roster is loaded
  | name  | role    |
  | Ada   | pilot   |
  | Quinn | ops     |
```

Then read them using a table shape:

```ts title="src/steps/crew.steps.ts"
import { When } from "../step-definitions";

When("the crew roster is loaded", (runtime, world) => {
  const table = runtime.requireTable("horizontal");
  world.state.crew = table.records();
});
```

Available table shapes:

- `horizontal`: first row is headers (`table.records()` returns objects).
- `vertical`: first column is headers (`table.records()` returns objects by row).
- `matrix`: full grid, with row/column headers.
- `headerless`: raw rows with no implicit headers.

Use `getTable(...)` to read without clearing, `consumeTable(...)` to clear after reading, and `requireTable(...)` to throw if no table is attached.

Vertical tables treat the first column as headers:

```gherkin
Then the environment is configured
  | key       | value |
  | region    | us-east |
  | retries   | 3 |
```

```ts title="src/steps/env.steps.ts"
import { Then } from "../step-definitions";

Then("the environment is configured", (runtime, world) => {
  const table = runtime.requireTable("vertical");
  world.state.env = table.getRecord(0);
});
```

Headerless tables return raw rows with optional coercion:

```gherkin
And the boarding zones are set
  | A |
  | B |
  | C |
```

```ts title="src/steps/boarding.steps.ts"
import { And } from "../step-definitions";

And("the boarding zones are set", (runtime, world) => {
  const table = runtime.requireTable("headerless");
  world.state.zones = table.raw().map((row) => row[0]);
});
```

Matrix tables allow both row and column headers:

```gherkin
When the bay occupancy grid is updated
  | bay | A | B | C |
  | 1   | 1 | 0 | 0 |
  | 2   | 0 | 1 | 1 |
```

```ts title="src/steps/bay.steps.ts"
import { When } from "../step-definitions";

When("the bay occupancy grid is updated", (runtime, world) => {
  const table = runtime.requireTable("matrix");
  world.state.occupancy = table.getCell("B", "2");
});
```

Table coercion defaults to:

- `horizontal`, `vertical`, `matrix`: coerce primitives by default
- `headerless`: do not coerce by default

Override per-call as needed:

```ts title="src/steps/crew.steps.ts"
const table = runtime.requireTable("horizontal", {
  coerce: false,
  transformers: {
    age: (value) => Number.parseInt(value, 10),
  },
});
```

### Step metadata and pickle context

Autometa attaches step metadata to the runtime so you can inspect file/line information and scenario context:

```ts title="src/steps/telemetry.steps.ts"
import { Then } from "../step-definitions";

Then("the telemetry is logged", (runtime, world) => {
  const metadata = runtime.currentStep;
  const source = metadata?.step?.source;
  if (source?.file && source?.line) {
    world.state.lastSeenAt = `${source.file}:${source.line}`;
  }
});
```

`runtime.currentStep` (also available via `runtime.getStepMetadata()`) contains:

- `feature`, `scenario`, `outline`, `example`, `step`, `definition`
- `source` refs with `file`, `line`, and `column` when available
- the resolved step keyword/expression for the step definition that matched

For a full view of compiled scenarios (including background steps), Autometa generates **pickles**. The `@autometa/gherkin` package exposes `SimplePickle` structures that include `feature`, `scenario`, and `steps` with location metadata:

```ts title="Pickle shape (simplified)"
export interface SimplePickle {
  id: string;
  name: string;
  uri?: string;
  tags: string[];
  feature: SimplePickleFeatureRef;
  scenario: SimplePickleScenarioRef;
  rule?: SimplePickleRuleRef;
  steps: SimplePickleStep[];
}
```

Pickle step entries include line/column data, docstrings, and tables, so you can build reporters or diagnostics that link directly back to the Gherkin file.

For full runtime helper APIs and pickle structures, see [Reference → Step runtime helpers](../reference/step-runtime).

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

### Parent worlds and inheritance

If you register feature/rule/scenario-outline hooks, Autometa can create worlds for those scopes and pass them as `context.parent` when creating nested worlds.

- Use `WORLD_INHERIT_KEYS` to copy specific parent values into the child world.
- A non-enumerable `world.ancestors` array is also attached (nearest parent first) for debugging or advanced use cases.

For debugging, `JSON.stringify(world)` is safe: Autometa defines a `toJSON()` serializer that avoids circular references (for example, when `world.app` holds services that reference the world).

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
