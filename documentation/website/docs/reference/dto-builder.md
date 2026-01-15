---
sidebar_position: 9
---

# DTO Builder Deep Dive

The `DtoBuilder` is a powerful tool for creating test data. It goes beyond simple object creation, offering features like nested builders, array manipulation, and validation.

## Creating a Builder

You can create a builder for an interface or a class.

### Interface Builder

```ts
interface User {
  id: string;
  name: string;
  roles: string[];
}

const userBuilder = DtoBuilder.forInterface<User>({
  defaults: {
    id: () => crypto.randomUUID(),
    roles: () => ["user"],
  },
});
```

### Class Builder

For classes, the builder instantiates the class (preserving `instanceof` identity) and respects both class property initializers and decorator-driven defaults.

```ts
class User {
  id: string = crypto.randomUUID();
  name: string = "";
}

const userBuilder = DtoBuilder.forClass(User);

const user = await userBuilder.create().name("Alice").build();
user instanceof User; // true
```

You can also provide manual defaults that override class property initializers:

```ts
const userBuilder = DtoBuilder.forClass(User, {
  defaults: {
    name: "anonymous",
  },
});
```

## Property Decorators

The package exports decorators for defining default values declaratively on class properties. These integrate automatically with `DtoBuilder.forClass()`.

### Available Decorators

Import decorators from the package:

```ts
import { DefaultValueDecorators, DTO, Property } from "@autometa/dto-builder";
```

#### `@DTO.value(defaultValue)`

Sets a static default value. The value is cloned on each build to prevent reference sharing.

```ts
class User {
  @DTO.value("anonymous")
  name: string;

  @DTO.value(false)
  active: boolean;
}
```

#### `@DTO.factory(() => value)`

Uses a factory function to produce a fresh default on each build. Essential for arrays, objects, or computed values.

```ts
class User {
  @DTO.factory(() => crypto.randomUUID())
  id: string;

  @DTO.factory(() => [])
  roles: string[];

  @DTO.factory(() => ({ theme: "light", notifications: true }))
  preferences: { theme: string; notifications: boolean };
}
```

#### `@DTO.dto(NestedClass)`

Creates a nested class instance with its own decorated defaults applied. The nested class is instantiated and its decorators are resolved recursively.

```ts
class Profile {
  @DTO.value("")
  bio: string;

  @DTO.value(false)
  verified: boolean;
}

class User {
  @DTO.value("")
  name: string;

  @DTO.dto(Profile)
  profile: Profile;
}

// When built, user.profile is a Profile instance with decorated defaults
const factory = DtoBuilder.forClass(User);
const user = await factory.default();

user.profile instanceof Profile; // true
user.profile.bio; // ""
user.profile.verified; // false
```

#### `@DTO.date(timestamp?)`

Creates a Date default. Without arguments, uses the current date at build time. Accepts a numeric timestamp or ISO string for fixed dates.

```ts
class Event {
  @DTO.date()
  createdAt: Date; // Current date at build time

  @DTO.date(1609459200000)
  epochStart: Date; // Fixed timestamp

  @DTO.date("2024-01-01T00:00:00.000Z")
  yearStart: Date; // ISO string
}
```

#### `@Property(valueOrFactory)`

A convenience decorator that auto-detects whether to use `@DTO.value()` or `@DTO.factory()`:

```ts
class User {
  @Property("anonymous") // Static value
  name: string;

  @Property(() => []) // Factory function
  roles: string[];
}
```

### Optional Properties

Decorators work seamlessly with optional properties. The decorated default is applied even when the property is declared optional:

```ts
class User {
  name: string = "";

  @DTO.date()
  createdAt?: Date; // Optional, but gets a default Date when built

  @DTO.factory(() => [])
  tags?: string[]; // Optional, defaults to empty array
}
```

### Decorator Inheritance

Decorated defaults aggregate up the prototype chain. Child class decorators override parent decorators for the same property:

```ts
class BaseEntity {
  @DTO.date()
  createdAt: Date;

  @DTO.value("draft")
  status: string;
}

class Article extends BaseEntity {
  @DTO.value("")
  title: string;

  @DTO.value("published") // Overrides parent's "draft"
  status: string;
}

const factory = DtoBuilder.forClass(Article);
const article = await factory.default();

article.createdAt; // Date (inherited from BaseEntity)
article.status; // "published" (overridden)
article.title; // ""
```

### Combining Decorators with Manual Defaults

Manual defaults passed to `forClass()` take precedence over decorator defaults:

```ts
class User {
  @DTO.value("anonymous")
  name: string;
}

const factory = DtoBuilder.forClass(User, {
  defaults: {
    name: "override", // Takes precedence over @DTO.value("anonymous")
  },
});

const user = await factory.default();
user.name; // "override"
```

## Fluent API

The builder instance provides a fluent API for modifying the object being built.

### Setting Properties

```ts
userBuilder.create()
  .set("name", "Alice")
  .assign("id", "123") // Alias for set
  .build();
```

### Nested Objects

If a property is an object, you can pass a callback to configure it using a nested builder.

```ts
interface Address {
  street: string;
  city: string;
}

interface User {
  address: Address;
}

userBuilder.create()
  .address((addr) => addr
    .set("street", "123 Main St")
    .set("city", "Metropolis")
  )
  .build();
```

### Array Manipulation

For array properties, the builder provides an `ArrayEditor` to easily modify the list.

```ts
userBuilder.create()
  .roles((list) => list
    .append("admin")
    .prepend("guest")
    .remove((role) => role === "user")
  )
  .build();
```

Supported array operations:
- `append(value)`
- `prepend(value)`
- `insert(index, value)`
- `set(index, value)`
- `update(index, updater)`
- `remove(predicate)`
- `replace(values)`
- `clear()`
- `sort(comparator)`

## Validation

You can attach a validator function to the builder to ensure the generated data is valid.

```ts
const userBuilder = DtoBuilder.forInterface<User>({
  validator: (user) => {
    if (!user.name) {
      throw new Error("User must have a name");
    }
  },
});
```

To skip validation for a specific build:

```ts
userBuilder.create().build({ skipValidation: true });
```

## Extending Builders

You can create a new builder based on an existing one, inheriting its defaults and configuration.

```ts
const adminBuilder = userBuilder.extend({
  defaults: {
    roles: () => ["admin"],
  },
});
```

You can also add **custom builder methods** (useful for compound operations and “domain helpers”):

```ts
const adminBuilder = userBuilder.extend({
  methods: {
    asAdmin() {
      return this.roles((roles) => roles.append("admin"));
    },
    named(name: string) {
      return this.name(name);
    },
  },
});

await adminBuilder.create().asAdmin().named("Alice").build();
```

## How it Works

The `DtoBuilder` uses a concept called **Blueprints** to manage defaults and overrides.

### Blueprints

A blueprint is a collection of default factories and validators. When you create a builder, you are essentially creating a blueprint.

When you call `.extend()`, the new builder inherits the blueprint from the parent and merges it with any new defaults you provide.

### Resolution Order

When `.build()` is called, the builder resolves the final object in the following order:

1.  **Instantiation**: A new instance of the target class or object is created.
2.  **Defaults**: Properties are populated using the defaults defined in the blueprint (and any parent blueprints).
3.  **Overrides**: Values set explicitly via `.set()`, `.assign()`, or nested builders are applied, overwriting any defaults.
4.  **Validation**: The validator function is executed against the final object (unless `skipValidation` is true).

This ensures that your specific test setup always takes precedence over general defaults.
