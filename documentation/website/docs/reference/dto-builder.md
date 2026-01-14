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

For classes, the builder respects property decorators if you use `@autometa/dto-builder` decorators (not yet documented here, assuming standard usage).

```ts
class User {
  id: string = crypto.randomUUID();
  name: string;
}

const userBuilder = DtoBuilder.forClass(User);
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
