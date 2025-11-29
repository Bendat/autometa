# @autometa/jest-transformer

Jest transformer for Autometa - transforms `.feature` files into Jest test suites.

## Installation

```bash
npm install @autometa/jest-transformer @autometa/jest-executor @autometa/runner @autometa/gherkin
```

## Usage

Configure Jest to use the transformer for `.feature` files:

```javascript
// jest.config.js
module.exports = {
  transform: {
    "^.+\\.feature$": "@autometa/jest-transformer"
  },
  testMatch: ["**/*.feature"],
  // Required for TypeScript step definitions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "feature"]
};
```

## Configuration

The transformer reads from `autometa.config.ts` (or `.js`, `.mjs`, etc.) in your project root.

```typescript
// autometa.config.ts
import { defineConfig } from "@autometa/config";

export default defineConfig({
  roots: {
    features: ["./features"],
    steps: ["./src/step-definitions.ts"]
  }
});
```

### Transformer Options

You can pass options to the transformer:

```javascript
// jest.config.js
module.exports = {
  transform: {
    "^.+\\.feature$": [
      "@autometa/jest-transformer",
      {
        configPath: "./custom-autometa.config.ts"
      }
    ]
  }
};
```

## How It Works

The transformer:

1. Reads your `autometa.config.ts` to locate step definition files
2. Parses the Gherkin feature file
3. Generates Jest test code that:
   - Imports your step definitions
   - Creates `describe` blocks for features
   - Uses `@autometa/jest-executor` to run scenarios

## License

MIT
