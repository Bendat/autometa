# @autometa/dto-builder

> Work in progress rewrite of the Autometa DTO builder utilities.

The legacy implementation now lives in `.reference/dto-builder` for parity checks while
the new TypeScript-first API evolves inside `src/`.

## Current Status

- `DtoBuilder.forInterface` and `DtoBuilder.forClass` expose immutable builders with fluent property accessors.
- Defaults, validators, and the new metadata pipeline compose through blueprint helpers.
- Builder instances support strong typing for declared properties plus dynamic helpers (`assign`, flexible `append`, `attach`) for test payloads and ad-hoc fields.
- Decorator-driven defaults are supported via `DefaultValueDecorators`/`DTO`, feeding into the metadata resolver automatically.

## Usage

```ts
import { DtoBuilder } from "@autometa/dto-builder";

interface UserDto {
	id: number;
	name: string;
	tags: string[];
	profile?: { name: string; active: boolean };
}

const factory = DtoBuilder.forInterface<UserDto>({
	defaults: {
		id: () => 0,
		name: "anonymous",
		tags: () => [],
		profile: () => ({ name: "", active: false }),
	},
	validator: (dto) => {
		if (!dto.name) {
			throw new Error("name is required");
		}
	},
});

const dto = await factory
	.create()
	.set("id", 42)
	.tags((tags) => tags.append("beta").prepend("alpha"))
	.merge("profile", { active: true })
	.profile((profile) => profile.name("Alice"))
	.assign("featureFlag", true)
	.append("auditLog", { type: "update", data: { field: "tags" } })
	.attach("metadata", "traceId", "abc-123")
	.build();

// dto => {
//   id: 42,
//   name: "anonymous",
//   tags: ["alpha", "beta"],
//   profile: { name: "Alice", active: true },
//   featureFlag: true,
//   auditLog: [{ type: "update", data: { field: "tags" } }],
//   metadata: { traceId: "abc-123" },
// }
```

Builders created with `DtoBuilder.forClass(SomeCtor)` behave the same but guarantee the
result is an instance of `SomeCtor`. Defaults sourced from decorators will be integrated
through the metadata pipeline once `collectDecoratorBlueprint` is implemented.

### Extending factories

Factories can be extended to override defaults and add custom builder methods:

```ts
const adminFactory = factory.extend({
	defaults: { name: "admin" },
	methods: {
		asAdmin() {
			return this.tags((tags) => tags.append("admin"));
		},
	},
});

await adminFactory.create().asAdmin().build();
```

### Dynamic helper methods

- `assign(key, value)` writes directly to the builder state for declared or ad-hoc keys.
- `append(key, value)` works on both typed array properties and dynamically introduced arrays.
- `attach(key, subKey, value)` creates or updates nested objects (defaults are cloned first so they stay isolated).
- Object-valued fluent properties accept a callback overload, e.g. `profile((p) => p.name("Eve").active(true))`, which supplies a nested builder scoped to that property.
 - Array-valued fluent properties accept a callback overload that exposes an immutable list editor, e.g. `tags((list) => list.append("beta"))`.

These helpers complement the typed primitives (`set`, `update`, `merge`, `derive`, `build`) and mirror the flexibility offered by the legacy builder. Callback overloads are available for object and array properties.

## Development

```bash
pnpm install
pnpm --filter @autometa/dto-builder build
```

## Testing

```bash
pnpm --filter @autometa/dto-builder test
```
