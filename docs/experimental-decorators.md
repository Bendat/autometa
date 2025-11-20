# Experimental Decorator App Support

## Goals
- Provide a first-class `.appWithExperimentalDecorators(AppCtor)` entry point on the runner builder.
- Allow dependency graphs that use `@Injectable`, `@Inject`, and `@LazyInject` metadata to be orchestrated automatically per Autometa scope.
- Avoid circular references by exposing a WORLD proxy instead of the raw world object when injected.

## Required Changes
1. **Decorator-Oriented App Factory**
   - Implement an orchestrator that accepts a container and an App constructor, replays decorator registrations, and returns the instantiated app.
   - Cache discovered providers per builder instance to prevent repeated reflection.
   - Register `WORLD_TOKEN` as a proxy object omitting the `app` reference.

2. **Decorator Enhancements** (`packages/injection`)
   - Update `@Injectable` to use metadata-derived constructor dependencies when `deps` arent explicitly provided.
   - Support `@LazyInject` on constructor parameters (lazy resolution) and retain property injection.
   - Ensure metadata storage is scoped so multiple containers can reuse the same class definitions safely.

3. **Scope-Aware Containers**
   - For experimental decorators, align container lifetimes with Autometa scopes (feature/rule/outline/scenario) once hook scoping work is ready.
   - Provide a hook for the orchestrator to derive containers from parent scopes.

4. **Integration with Runner Builder**
   - Wire the orchestrator into `.appWithExperimentalDecorators` so the builder drags in decorator metadata when composing the world factory.
   - Keep the flow opt-in; default `.appWithFactory` remains metadata agnostic.

5. **Testing**
   - Add integration coverage in `packages/runner` to ensure decorated graphs resolve and receive proxied worlds.
   - Extend `@autometa/injection` tests for new decorator behaviors.

6. **Documentation**
   - Prepare usage examples highlighting decorator-driven apps and WORLD proxy semantics.

---
