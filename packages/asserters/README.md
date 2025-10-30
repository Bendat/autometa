# @autometa/asserters

Type-safe runtime assertions for the Autometa ecosystem.

## Features

- **Type narrowing** - Assertions narrow TypeScript types automatically
- **Clear error messages** - Actionable errors with context
- **Helpful suggestions** - Get similar key names when accessing invalid properties
- **Composable utilities** - Small, focused functions that work together
- **Zero dependencies** - Except `@autometa/errors` and `closest-match`

## Installation

\`\`\`bash
npm install @autometa/asserters
# or
pnpm add @autometa/asserters
\`\`\`

## API

### assertDefined

Asserts a value is not \`null\` or \`undefined\`.

\`\`\`typescript
import { assertDefined } from "@autometa/asserters";

const maybeValue: string | undefined = getValue();
assertDefined(maybeValue, "user.name");
// maybeValue is now typed as string
console.log(maybeValue.toUpperCase());
\`\`\`

### assertKey / confirmKey / getKey

Work with object keys safely.

\`\`\`typescript
import { assertKey, confirmKey, getKey } from "@autometa/asserters";

const config: Record<string, unknown> = getConfig();

// Assert key exists (throws on failure)
assertKey(config, "apiKey");
const key = config.apiKey; // TypeScript knows this is safe

// Check if key exists (type guard)
if (confirmKey(config, "optionalKey")) {
  console.log(config.optionalKey);
}

// Get key value (throws on failure with helpful suggestions)
const apiKey = getKey(config, "apiKey");
\`\`\`

When accessing an invalid key, you get helpful suggestions:

\`\`\`typescript
assertKey(config, "firstname"); // Did you mean: firstName?
\`\`\`

### assertLength / assertMinLength / assertMaxLength

Assert array or string length constraints.

\`\`\`typescript
import { assertLength, assertMinLength, assertMaxLength } from "@autometa/asserters";

// Exact length
assertLength(args, 3, "function arguments");

// Minimum length
assertMinLength(password, 8, "password");

// Maximum length
assertMaxLength(description, 280, "tweet");
\`\`\`

### assertIs

Assert type or instance checks.

\`\`\`typescript
import { assertIs } from "@autometa/asserters";

// Type checking
assertIs(value, "string");
assertIs(count, "number");

// Instance checking
assertIs(error, Error);
assertIs(date, Date);

// Value checking
assertIs(status, 200);
assertIs(flag, true);
\`\`\`

### lie / unsafeCast

**Use with extreme caution--filter @autometa/asserters type-check* These bypass runtime checks.

\`\`\`typescript
import { lie, unsafeCast } from "@autometa/asserters";

// Type assertion (no runtime effect)
const data: unknown = getData();
lie<User>(data);
// TypeScript thinks data is User, but no validation occurred!

// Unsafe cast (returns typed value)
const config = unsafeCast<Config>(rawData);
\`\`\`

## Error Handling

All assertions throw \`AutomationError\` from \`@autometa/errors\`:

\`\`\`typescript
import { assertKey, InvalidKeyError } from "@autometa/asserters";

try {
  assertKey(config, "missing");
} catch (error) {
  if (error instanceof InvalidKeyError) {
    console.log(error.suggestions); // ["missng", "mising"]
  }
}
\`\`\`

## Best Practices

1. **Always provide context** - Makes debugging easier
   \`\`\`typescript
   assertDefined(value, "config.database.host");
   \`\`\`

2. **Use type guards for optional checks** - Prefer \`confirmKey\` over try/catch
   \`\`\`typescript
   if (confirmKey(obj, "optionalProp")) {
     // Use obj.optionalProp
   }
   \`\`\`

3. **Avoid unsafe casts** - Use proper validation instead of \`lie\`/\`unsafeCast\`

## License

MIT
