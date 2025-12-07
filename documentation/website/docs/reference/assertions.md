---
sidebar_position: 10
---

# Assertions Reference

The `ensure` function provides a fluent API for assertions. It is designed to be readable, extensible, and context-aware.

## Core Assertions

### Equality

```ts
ensure(value).toBe(expected);
ensure(value).toEqual(expected); // Deep equality
ensure(value).toStrictEqual(expected); // Strict deep equality
```

### Truthiness

```ts
ensure(value).toBeTruthy();
ensure(value).toBeFalsy();
ensure(value).toBeDefined();
ensure(value).toBeUndefined();
ensure(value).toBeNull();
```

### Types

```ts
ensure(value).toBeInstanceOf(MyClass);
```

### Collections

```ts
ensure(array).toHaveLength(3);
ensure(array).toContainEqual(item);
ensure(array).toBeArrayContaining([1, 2]);
ensure(object).toBeObjectContaining({ id: 1 });
```

## HTTP Assertions

When asserting against an `HTTPResponse` or similar object, specialized matchers are available.

```ts
ensure(response).toHaveStatus(200);
ensure(response).toHaveStatus("OK"); // Matches status text
ensure(response).toHaveHeader("Content-Type", "application/json");
ensure(response).toBeCacheable(); // Checks Cache-Control headers
ensure(response).toHaveCorrelationId(); // Checks for common correlation ID headers
```

## Negation

All assertions can be negated using the `.not` property.

```ts
ensure(value).not.toBe(expected);
ensure(array).not.toHaveLength(0);
```

## Custom Messages (Labels)

You can provide a custom label to make error messages more descriptive. This is particularly useful when asserting against dynamic values or properties.

```ts
ensure(value, { label: "User ID" }).toBe(123);
// Error: Expected User ID to be 123, but got 456
```

## Deep Dive: How `ensure` Works

The `ensure` function you import from your step definitions is actually a **Facade** created by the `CucumberRunner`. It behaves differently depending on how you call it.

### 1. Standard Assertion: `ensure(value)`

When called with a value, it returns an `EnsureChain`. This is the standard assertion object with methods like `.toBe()`, `.toEqual()`, etc.

```ts
ensure(1).toBe(1);
```

### 2. Plugin Access: `ensure(world)`

When called with the `World` object, it returns the **Facade** itself, but with your registered plugins attached as properties.

```ts
// Assuming you registered a plugin with the key 'custom'
ensure(world).custom.isAwesome();
```

This works because `ensure` is a Proxy. When it detects that the argument is the `World` object, it delegates to the plugin factory associated with that world.

### Why the "Intermediate Property"?

You might notice that accessing plugins requires an intermediate property (the plugin key), like `.custom` in the example above.

```ts
ensure(world).custom.isAwesome();
```

This design choice prevents naming collisions. Since plugins can define any method names they want, merging them all directly onto `ensure(world)` could lead to conflicts (e.g., two plugins defining `hasStatus`). By namespacing plugins under their registration keys, you get a clean, conflict-free API.

### Context Awareness

Plugins are "World-Aware". When you call `ensure(world)`, the plugins are instantiated with that specific world instance. This allows them to access shared state, such as the last HTTP response or database connection.

```ts
const myPlugin = ({ ensure }) => (world) => ({
  hasStatus(status) {
    // Access world.lastResponse here
    ensure(world.lastResponse.status).toBe(status);
  }
});
```

## Extending `ensure`

See the [Assertion Plugins](../getting-started/assertion-plugins.md) guide for details on how to add your own domain-specific assertions.
