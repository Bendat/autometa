# Fluent Callback Enhancements — Design Plan

> Status: Object callbacks implemented; array callbacks now ship via an immutable list editor API (see implementation notes throughout).

## Context & Goals

- **Goal:** enrich fluent property accessors so callers can supply a callback that receives a nested builder when the property represents an object or array. Example target API: `builder.profile((profile) => profile.name("Bob").age(2));`.
- **Motivation:** regain ergonomics from the legacy proxy API while keeping strong typing and immutability guarantees in the rewrite.
- **Scope (initial):** object-valued properties on interface and class builders. Arrays are desirable, but we can stage them after proving the object pattern.
- **Out of scope (for now):** async callbacks, deep metadata resolution for nested DTO classes, decorator hydration (handled separately via blueprint pipeline).

## High-Level Design

1. **Overload strategy**
   - Extend `FluentProperty<T, K>` so, when `T[K]` is an object type (and not an array/function), the callable supports two signatures:
     1. `builder.profile(value: T[K]): BuilderInstance<T>` (existing behaviour).
     2. `builder.profile(configure: (nested: NestedBuilder<T[K]>) => NestedBuilder<T[K]> | void): BuilderInstance<T>`.
   - For arrays, the proposed overload is either:
     - `builder.history((list) => list.append(...).replace(...))`, where `list` is a light-weight facade providing safe mutations; or
     - `builder.history((entry) => entry.append(builder => ...))`, where we piggy-back on the existing `append` overload. Decision deferred until object path is validated.

2. **Nested builder representation**
   - Introduce `createNestedBuilderFactory<TChild>` that returns a builder with the same fluent API surface but constrained to `TChild` (no `.derive()`—just `.set`, `.update`, `.merge`, `.build`).
   - Nested builder config needs:
     - `createTarget`: default to `{}` for objects, or fallback to user-specified defaults via metadata if available.
     - `defaults`: pulled from parent `BuilderConfig` if we later pipe decorator metadata for the child property.
     - `validator`: optional. We can skip in v1 to limit complexity.
   - The callback should receive a proxy `NestedBuilderInstance<TChild>` created via the existing `createFluentProxy`, so behaviour stays consistent.

3. **Runtime flow for object callbacks**
   1. Resolve the current property value via `state.get(key)`.
   2. Create a nested builder initialised with that value (or with a cloned default).
   3. Execute the callback, capturing the returned builder (or defaulting to the original nested builder if `void` is returned).
   4. Call `.build()` on the nested builder to materialise an updated value.
   5. Feed the result into `state.set(key, value)` to preserve immutability guarantees.

4. **Type modelling**
   - Add conditional type alias:
     ```ts
     type NestedCallback<T> = IsPlainObjectType<T> extends true
       ? (nested: NestedBuilderInstance<T>) => NestedBuilderInstance<T> | void
       : never;
     ```
   - Update `FluentProperty<T, K>` to merge callable signatures when `NestedCallback<T[K]>` is not `never`.
   - `NestedBuilderInstance<T>` mirrors `BuilderInstance<T>` but without dynamic helpers (or with a curated subset to keep typings manageable).
   - Ensure TypeScript inference picks the overload automatically (no explicit generics required at call sites).

5. **Implementation hooks**
   - Extend `BuilderImpl` with a method `mutateObjectProperty(key, mutator)` that wraps the callback orchestration. This keeps proxy logic minimal and centralises cloning.
   - In `createFluentProxy`, when generating a fluent accessor for an object property, return a function that dispatches to `mutateObjectProperty` when it detects a callback parameter.
   - To avoid repeated shape checks, cache property metadata (`isPlainObject` flag) when building defaults, or derive lazily using the existing `isPlainObject` utility.

## Array Handling (Future Work)

- **Option A (list facade):** provide an object with helpers (`append`, `set(index, value)`, `remove(predicate)`), internally constructing new arrays and returning them to the parent.
- **Option B (element builder):** treat the callback argument as an element builder, i.e. `.history((element) => element.append((item) => item.action("login")))`. Requires more complex typing but keeps per-entry semantics close to object handling.
- **Recommendation:** start with Option A—offers immediate ergonomics for common mutations while avoiding higher-order nested builders inside loops.

## Metadata Considerations

- Current metadata pipeline (`resolveBuilderConfig`) can emit defaults for nested properties. We must ensure `collectDecoratorBlueprint` eventually surfaces child defaults so nested builders can honour them.
- Validators: nested callbacks should probably *not* invoke parent validators until the outer `.build()` stage, to avoid double validation.
- Performance: each callback invocation constructs a nested builder. We need to measure but expect this to be acceptable for test helpers.

## Step-by-Step Implementation Plan

1. **Type groundwork**
   - Add `NestedBuilderInstance` type + supporting conditional helpers in `types.ts`.
   - Update `FluentProperty` to include callback overloads for qualifying properties.
   - Export any new public types if needed for advanced users (optional).

2. **Runtime mechanics**
   - Introduce `createNestedBuilderFactory` leveraging `createBuilderFactory` with a minimal config.
   - Implement `BuilderImpl.mutateObjectProperty` to orchestrate nested builder creation, callback execution, and state update.
   - Modify the fluent proxy generator to detect callback arguments and route them through the mutator.

3. **Testing**
   - Extend `index.test.ts` with scenarios covering:
     - Object property callback that sets multiple fields.
     - Derived builder interactions ensuring originals aren’t mutated.
     - Combination of direct value calls and callback calls.
     - Integration with defaults (including decorator defaults once available).
   - Regression tests ensuring non-object properties still behave correctly (overload resolution fallbacks).

4. **Documentation**
   - Update README with callback usage examples and mention limitations (objects only for the first iteration).

5. **Future iteration**
   - Evaluate demand for array callbacks; if adopted, implement chosen strategy and extend typings/tests accordingly.

## Open Questions

1. **Should nested builders expose dynamic helpers (`assign`, `attach`)?** They are convenient, but exposing them may blur the distinction between parent and child scopes.
2. **Do we support returning raw values from the callback (`profile(() => ({ ... }))`)?** Allowing raw returns may simplify simple cases but complicates overload resolution. Proposal: keep to builder return or void for clarity.
3. **Error handling:** should we surface errors immediately or wrap them in builder-specific messages? Currently leaning toward bubbling raw errors.
4. **Performance impact:** acceptable for test usage, but worth profiling once implemented.

## Decision Checkpoints

- Confirm we’re happy delivering object callbacks first and staging array support.
- Validate that nested builders shouldn’t cascade validation until the parent `build()` call.
- Decide whether to expose the nested builder type publicly (for user-defined helpers) or keep it internal.
