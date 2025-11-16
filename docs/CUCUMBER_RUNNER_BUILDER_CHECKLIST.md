<!-- cspell:disable -->

# Cucumber Runner Fluent Builder Checklist

## Architecture & API Design

- [ ] Finalize fluent builder API shape (`withWorld()`, `app()`, terminal methods).  
- [ ] Define builder type transformations for app injection (`WorldWithApp`).  
- [ ] Decide default behavior when `.app()` is omitted (plain `World`).  
- [ ] Specify how decorator mode integrates (allow, warn, or ignore `.app()`).  
- [ ] Document how the builder delegates to existing factories (`createRunner`, `createGlobalRunner`, `createRunnerDecorators`).  

## Implementation

- [ ] Implement builder state object & chaining methods.  
- [ ] Implement terminal methods: `steps()` (unified surface), `decorators()`, etc.  
- [ ] Ensure global + scoped steps share registry when using unified surface.  
- [ ] Add feature path helpers for transformer usage (e.g., `Feature(path, fn)`).  
- [ ] Update exports (`index.ts`) to expose builder instead of (or alongside) lower-level factories.  

## Compatibility & Migration

- [ ] Review existing global/scoped usage to confirm builder covers them.  
- [ ] Ensure current APIs remain available (or provide migration plan).  
- [ ] Update transformer integrations to call the builder-generated functions.  
- [ ] Verify decorator workflows still function without `.app()` context.  

## Testing

- [ ] Add unit tests for builder chaining behaviour.  
- [ ] Add integration tests covering: 
  - [ ] Scoped Feature usage + global steps mixed.  
  - [ ] Global-only step files via builder.  
  - [ ] Decorator usage via builder.  
  - [ ] Feature path injection for transformer scenario.  
- [ ] Update existing tests to use the builder where appropriate.  

## Documentation

- [ ] Update package README with builder examples (scoped, global, decorators).  
- [ ] Add notes on DI/App registration and resulting world shape.  
- [ ] Document transformer integration pattern (feature path, global steps).  
- [ ] Provide migration guide from legacy APIs.

<!-- cspell:enable -->
