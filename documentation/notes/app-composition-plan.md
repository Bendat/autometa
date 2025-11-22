# DI Ergonomics Plan

## Objective
- Deliver a builder-friendly syntax for app wiring that hides decorator boilerplate while keeping existing `.app()` flexibility intact.

## Layered API
- **One-liner helper**: `.app(App.withExperimental(BrewBuddyApp))` wraps the composition DSL and handles world proxy safety.
- **Fluent composer**: `.app((compose) => compose.registerClass(...).registerApp(...))` for richer setups without touching raw decorators.

## Composition Surface
```ts
.app((compose) =>
  compose
    .registerClass(FooService, {
      bar: BarService,
      world: WORLD_TOKEN,          // proxy world without circular app ref
      $constructor: [BazService],   // constructor deps
      scope: Scope.SCENARIO,        // optional scope
    })
    .registerValue("config", config)
    .registerApp(BrewBuddyApp, {
      http: HttpClient,
      memory: FooService,
    })
);
```
- `registerApp` returns the app instance and updates the builder’s inferred world type so `steps()` sees the new `app` shape.
- Maintain backward compatibility by treating callbacks without parameters as the existing “manual control” route.

## Helper Entry Point
```ts
class App {
  static withExperimental<AppCtor>(
    ctor: AppCtor,
    options?: AppRegistrationOptions
  ) {
    return (compose: CompositionContext<World>) =>
      compose.registerApp(ctor, options).resolve();
  }
}
```
- Allows quick adoption while still using the same composition internals.

## DI Container Enhancements
- Extend registrations to accept descriptor objects for constructor/property injection and scopes.
- Provide helpers that translate descriptors into the existing decorator metadata so we can reuse the current container implementation.
- Ensure `WORLD_TOKEN` resolves to a safe proxy that omits the app reference until after instantiation.

## Runner Builder Integration
- Overload `.app()` so the composer argument is detected; thread the resulting world/app types through the generics.
- Preserve existing behavior for factories returning promises or plain instances.
- Update `withWorld` interplay so switching worlds resets cached composition state correctly.

## Examples & Documentation
- Convert BrewBuddy example to `.assertionPlugins(...)` plus new `.app(App.withExperimental(BrewBuddyApp))`.
- Author docs demonstrating both quick helper and full composition DSL, clarifying when to drop down to raw container access.

## Validation Strategy
- Unit tests for composition helpers, DI registration descriptors, and world proxy behavior.
- End-to-end run of examples (`@autometa/examples-vitest-functions`) to confirm app wiring works and world typing is correct.
- Regression pass to ensure legacy `.app(({ container }) => …)` continues to function.

## Iteration Checkpoints
1. Container registration descriptors implemented & tested.
2. Composition DSL exposed through builder overloads.
3. Helper `.withExperimental` finalized with documentation.
4. Examples migrated and feedback collected before broader rollout.
