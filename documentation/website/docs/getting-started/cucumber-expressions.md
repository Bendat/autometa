---
sidebar_position: 7
---

# Cucumber Expressions

Autometa supports Cucumber Expressions for matching steps. This allows you to define flexible step definitions with typed parameters.

## Built-in Types

The following types are available out of the box:

| Type | Matches | Output |
| --- | --- | --- |
| `{int}` | Integers | `number` |
| `{float}` | Floats | `number` |
| `{word}` | Single word | `string` |
| `{string}` | Quoted string ("..." or '...') | `string` |
| `{}` | Anything (anonymous) | `string` |

## Custom Parameter Types

You can define your own parameter types to match specific patterns and transform them into rich objects. This keeps your step definitions clean and type-safe.

### Defining Parameter Types

Create a `ParameterTypeDefinition[]` and export it.

```ts
// src/support/parameter-types.ts
import type { ParameterTypeDefinition } from "@autometa/cucumber-expressions";
import type { MyWorld } from "../world";

export const myParameterTypes: ParameterTypeDefinition<MyWorld>[] = [
	{
		name: "color",
		pattern: /red|blue|green/,
		transform: (value) => String(value).toUpperCase(),
	},
];
```

### Registering Parameter Types

Pass your parameter type definitions to the `CucumberRunner` builder.

```ts
// src/step-definitions.ts
import { CucumberRunner } from "@autometa/runner";
import { myParameterTypes } from "./support/parameter-types";

const runner = CucumberRunner.builder()
  .parameterTypes(myParameterTypes)
  // ...
```

### Using Custom Types

Now you can use your custom type in your step definitions.

```ts
Given("I have a {color} ball", (color, world) => {
  // color is "RED", "BLUE", or "GREEN"
  world.ball.color = color;
});
```

## Advanced Usage

### Context-Aware Transformers

Transformers can access the `World` object, allowing you to perform validation or lookups based on the current scenario state.

```ts
export const myParameterTypes: ParameterTypeDefinition<MyWorld>[] = [
	{
		name: "product",
		pattern: /[a-z]+/,
		transform: (value, context) => {
			const name = String(value);
			const product = context.world.db.findProduct(name);
			if (!product) {
				throw new Error(`Product ${name} not found`);
			}
			return product;
		},
	},
];
```

### Strong Typing

You can define a type map to ensure your step definitions are type-safe.

```ts
interface MyExpressionTypes {
  readonly color: "RED" | "BLUE" | "GREEN";
  readonly product: Product;
}

const runner = CucumberRunner.builder()
  .expressionMap<MyExpressionTypes>()
  // ...
```

Now, TypeScript will infer the correct types for your step arguments.
