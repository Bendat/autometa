# @autometa/assertions

Autometa's assertion toolkit built around the `ensure(value)` entry point. The package provides a fluent matcher chain with TypeScript-aware narrowing so you can write expressive assertions across runners without depending on Jest/Vitest globals.

```ts
import { ensure } from "@autometa/assertions";

const result: string | undefined = fetchName();

const narrowed = ensure(result, { label: "result" })
	.toBeDefined()
	.toBeInstanceOf(String)
	.value;

ensure({ count: 1, name: "Foo" }).toBeObjectContaining({ name: "Foo" });
ensure([1, 2, 3]).toBeArrayContaining([2]);
ensure(new Set([1, 2, 3])).toBeIterableContaining([3]);
ensure("text").toHaveLength(4);
```

See `IMPLEMENTATION_CHECKLIST.md` for the roadmap and open work items while the API stabilises.