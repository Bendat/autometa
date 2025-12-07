---
sidebar_position: 10
---

# Assertions Reference

The `ensure` function provides a fluent API for assertions. It is designed to be readable and extensible.

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

## Custom Messages

You can provide a custom label to make error messages more descriptive.

```ts
ensure(value, { label: "User ID" }).toBe(123);
// Error: Expected User ID to be 123, but got 456
```

## Extending `ensure`

See the [Assertion Plugins](../getting-started/assertion-plugins.md) guide for details on how to add your own domain-specific assertions.
