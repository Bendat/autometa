# Vitest Decorators Example

This example demonstrates how to use class-based decorator patterns for step definitions
with Autometa and Vitest, including dependency injection support.

## Architecture

Instead of the functional step definition pattern:

```typescript
Given("I have the number {int}", (value: number, world: World) => {
  world.result = value;
});
```

This example uses a decorator-based class pattern with constructor injection:

```typescript
@Binding()
class ArithmeticSteps {
  constructor(
    private readonly world: ArithmeticWorld,
    private readonly calculator: CalculatorService
  ) {}

  @Given("I have the number {int}")
  setNumber(value: number): void {
    this.world.result = value;
  }

  @When("I add {int}")
  addNumber(value: number): void {
    this.world.result = this.calculator.add(this.world.result ?? 0, value);
  }
}
```

## Key Features

- **Constructor Injection**: World and services injected via constructor
- **Per-Scenario Instances**: Step class instances created fresh for each scenario
- **Clean Step Methods**: Steps only receive Cucumber parameters, not the world
- **Service Support**: Additional services can be injected alongside the world

## Key Components

- **`@Binding()`** - Class decorator that marks a class as containing step definitions
- **`@Given()`, `@When()`, `@Then()`, `@And()`, `@But()`** - Method decorators that define steps
- **`registerBindingClass()`** - Bridges decorator-based steps to the functional API with DI
- **`getStepInstance()`** - Lazy instantiation with dependency injection

## Running Tests

```bash
# Run feature tests
pnpm features

# Watch mode
pnpm features:watch
```

## Files

- `src/decorators/` - Decorator implementations (@Binding, @Given, etc.)
- `src/steps/` - Step definition classes
- `src/services/` - Injectable services (CalculatorService)
- `src/world.ts` - World interface and defaults
- `.features/` - Gherkin feature files
