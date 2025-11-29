# Vitest Decorators Example

This example demonstrates how to use class-based decorator patterns for step definitions
with Autometa and Vitest.

## Architecture

Instead of the functional step definition pattern:

```typescript
Given("I have the number {int}", (value: number, world: World) => {
  world.result = value;
});
```

This example uses a decorator-based class pattern:

```typescript
@Binding()
class ArithmeticSteps {
  @Given("I have the number {int}")
  setNumber(value: number, world: World): void {
    world.result = value;
  }
}
```

## Key Components

- **`@Binding()`** - Class decorator that marks a class as containing step definitions
- **`@Given()`, `@When()`, `@Then()`, `@And()`, `@But()`** - Method decorators that define steps
- **`registerBindingClass()`** - Bridges decorator-based steps to the functional API

## Running Tests

```bash
# Run feature tests
pnpm features

# Watch mode
pnpm features:watch
```

## Files

- `src/decorators/` - Decorator implementations
- `src/steps/` - Step definition classes
- `src/world.ts` - World interface and defaults
- `.features/` - Gherkin feature files
