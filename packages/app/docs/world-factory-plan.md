# World & Step Factory Plan

## Objectives
- Replace the legacy "App" abstraction with a world-centric API that aligns with Cucumber expectations.
- Support hierarchical world scopes (feature → rule → outline → scenario) with predictable lifetimes and parent access.
- Hide dependency container mechanics from end users while keeping constructor/property injection viable.
- Provide step-definition factories that return idiomatic registration helpers (`Given`, `When`, `Then`, hooks) and a fluent/flow API.
- Maintain decorator compatibility by sourcing worlds through DI rather than exposing the container itself.

## Key Concepts

### Scope-Aware Worlds
```
FeatureWorld ──┐
              │  parent links
RuleWorld ─────┤
OutlineWorld ──┤
ScenarioWorld ─┘ (default world)
```
- Each scope has its own world instance created once per scope lifetime.
- Scenario worlds can reach their parents via `world.feature`, `world.rule`, `world.outline`, `world.examples`.
- Hook callbacks receive the narrowest world for their scope and optionally parent references:
  - `BeforeFeature`/`AfterFeature` → `FeatureWorld`
  - `BeforeRule`/`AfterRule` → `{ rule: RuleWorld; feature: FeatureWorld }`
  - `BeforeScenario`/`AfterScenario` → `{ scenario: ScenarioWorld; feature?: FeatureWorld; rule?: RuleWorld; outline?: OutlineWorld }`
- Worlds are disposed (and DI scopes torn down) when their corresponding Cucumber scope finishes.

### Dependency Management
- We continue using `@autometa/injection` under the hood, but `Container` is no longer exposed.
- Worlds and fixtures are registered with scope metadata:
  - `@WorldScope("scenario" | "rule" | "feature" | "outline")`
  - `@Inject(World)` remains valid for constructor/property injection.
- Container hierarchy mirrors world hierarchy: each scope gets a child container whose lifetime matches the world instance.
- Constructor injection allows decorator-driven step classes to receive worlds via `constructor(private world: MyWorld)`.

## Public API Sketch

### Step Definition Factory
```ts
import { createStepDefinitions } from "@autometa/app";

const { Given, When, Then, And, But, hooks } = createStepDefinitions(MyScenarioWorld, {
  feature: MyFeatureWorld,
  rule: MyRuleWorld,
  outline: MyOutlineWorld,
  expressions: [/* optional custom cucumber expressions */],
  plugins: [/* optional adapters */],
});

Given("foo", (world) => {
  world.foo = 1;
  world.service.doSomething(world.foo);
});

When("bar", function () {
  this.counter += 1; // `this` bound to world when using function syntax
});

hooks.BeforeScenario(({ scenario, feature }) => {
  scenario.counter = 0;
  feature.totalScenarios += 1;
});
```
- `createStepDefinitions(worldCtor, options?)` returns registration helpers bound to a scope manager instance.
- Callback signature choices:
  1. `(world: MyScenarioWorld) => void`
  2. `function (this: MyScenarioWorld) { … }`
  3. Decorated class methods (see below).
- Hooks accept structured payloads rather than raw world instances to make scope intent explicit.

### Fluent / Flow API
```ts
const flow = createStepDefinitions.flow(MyWorld);

flow
  .given("foo")
  .run((world) => {
    world.foo = 1;
  })
  .when("bar")
  .run(async ({ feature }) => {
    await feature.prepare();
  });
```
- `flow` keeps method chaining for developers who prefer a builder DSL.
- Each chained `.run` registers a step or hook immediately with accumulated metadata.

### Decorator Integration
```ts
import { StepDefinitions, given, when } from "@autometa/app";

@StepDefinitions(MyWorld)
export class MySteps {
  constructor(private readonly world: MyWorld) {}

  @given("foo")
  async givenFoo() {
    this.world.foo = 1;
  }

  @when("bar")
  bar() {
    this.world.bar();
  }
}
```
- `@StepDefinitions(WorldCtor)` boots a local scope manager for the class and registers decorated methods during instantiation.
- Decorators resolve the same metadata as factory helpers, enabling coexistence of functional and class-based styles.

## Internal Architecture

### Scope Manager
Responsibilities:
- Track active feature/rule/outline/scenario containers.
- Create/destroy world instances according to cucumber events.
- Expose adapter interface consumed by step/hook factories.

```ts
interface ScopeManager {
  resolveScenarioWorld(): Promise<MyScenarioWorld>;
  currentHierarchy(): WorldHierarchy;
  withScope<T>(scope: WorldScope, action: () => Promise<T>): Promise<T>;
}
```

### Registration Pipeline
```
createStepDefinitions -> StepRegistry -> Cucumber Adapter
                                         (wrap Given/When/Then)
```
- The registry stores metadata: expression, handler, needed injections, scope hints.
- Adapter translates registry entries into Cucumber calls, injecting the right world per execution.
- Allows future integrations (e.g., Jest-like runner) by swapping adapters.

### Handler Wrapping
- Each registered handler is wrapped as follows:
  1. Resolve scenario world (async safe).
  2. Optionally bind `this` to the world if the handler expects a function context.
  3. Provide parent scopes via second parameter `{ feature, rule, outline, examples }` when requested (detected via parameter length or explicit options).
  4. Execute within error boundary (reuse fixture-proxies `withErrorBoundary`).

## Migration Notes
- Config-based app declaration is removed; users migrate to `createStepDefinitions`.
- Existing global declaration merging for `App` becomes unnecessary; worlds are typed via generics on the factory helper.
- Provide codemods/docs guiding users to create explicit world classes per scope.
- Introduce compatibility layer temporarily (optional) that exposes previous `AppType` decorator but warns when used.

## Outstanding Decisions
- Exact shape of custom expression registration (inline array vs separate helper).
- Whether to auto-create default Feature/Rule worlds when only Scenario world is supplied.
- Strategy for async container disposal (ensure `After*` hooks flush resources deterministically).

## Next Steps
1. Define TypeScript interfaces/types described above in `src/` (no behaviour yet) to pin API contracts.
2. Implement scope manager skeleton using existing injection utilities.
3. Build step factory returning no-op wrappers, then iterate to integrate with Cucumber runtime.
4. Update README + migration guide once behaviours are validated.
