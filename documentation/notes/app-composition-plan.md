# DI Ergonomics Plan

## Objective
- Deliver a builder-friendly syntax for app wiring that hides decorator boilerplate while keeping existing `.app()` flexibility intact.

## Layered API
- **One-liner helper**: `.app(App.compositionRoot(BrewBuddyApp))` wraps the composition DSL and handles world proxy safety.
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
  static compositionRoot<AppCtor>(
    ctor: AppCtor,
    options?: AppRegistrationOptions
  ) {
    return (compose: CompositionContext<World>) =>
      compose.registerApp(ctor, options).resolve();
  }
}
```

## DI Container Enhancements

## Runner Builder Integration

## Examples & Documentation

## Validation Strategy

## Iteration Checkpoints
1. Container registration descriptors implemented & tested.
2. Composition DSL exposed through builder overloads.
3. Helper `.compositionRoot` finalized with documentation.
4. Examples migrated and feedback collected before broader rollout.
