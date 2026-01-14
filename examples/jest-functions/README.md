# Jest Functions Example

This example demonstrates using Autometa with Jest as the test runner.

## Setup

```bash
pnpm install
```

## Running Tests

### Feature Tests (Gherkin)

```bash
pnpm features
```

### Unit Tests

```bash
pnpm test
```

## How It Works

1. **autometa.config.ts** - Configures where to find features and step definitions
2. **jest.config.cjs** - Configures Jest to use `@autometa/jest-transformer` for `.feature` files
3. **src/step-definitions.ts** - Contains step definitions using the fluent builder pattern
4. **.features/** - Contains Gherkin feature files

## Key Differences from Vitest

- Uses CommonJS Jest config (`.cjs`) for compatibility
- Uses `ts-jest` for TypeScript transformation
- Uses `@autometa/jest-executor` instead of `@autometa/vitest-executor`
