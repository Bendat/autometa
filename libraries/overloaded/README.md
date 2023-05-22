# Overloaded

Overloads as easy to make as they are to use.

Inspired by [zod](https://zod.dev/) and [myzod](https://github.com/davidmdm/myzod)

## Quick Start

### Contrived Example:

```ts
export function myFunc(a: string): string;
export function myFunc(a: string, b: number): string;
export function myFunc(a: string, b: string): string;
export function myFunc(a: string, b: { a: string; b: number[] }): string;
export function myFunc(a: string, b: MyClassBuilder): MyClass;
export function myFunc(...args: unknown) {
  return overloads(
    //     optional name 'a'   // type of 'a' inferred as 'string'
    params(string("a")).matches((a) => `hello ${a}`),

    // simply declare each argument as you expect it. The first match will
    // be executed
    params(string("a"), number("b")).matches((a, b) => `hello ${a}`.repeat(b)),

    // Verify complex (even nested) objects, arrays, tuples.
    params(string("a"), shape({ a: string(), arr: array([number()]) })).matches(
      (a, b) => b.arr.map((num) => `${num}: hello ${a}: ${b.a}`)
    ),

    // Check for an instance of a class. Optionally provide a 'shape' as above
    params(string("a"), instance("b", MyClassBuilder)).matches(
      (name, myClassBuilder) => myClassBuilder.setName(name).build()
    ),

    // validate actual values - useful for configurable, non overloaded functions
    // or implementing the strategy pattern.
    params(
      string("a", { equals: "admin" }),
      string("b", { in: ["buyer", "seller"] })
    ).matches((a) => `hello ${a}`),

    // Throw an error if no matching overload, or define a fallback
    fallback((...args: unknown[]) => {
      // .. do some fallback stuff
    })
  ).use(args);
}
```

### Install

```sh
npm add @autometa/overloaded
```

```sh
yarn add @autometa/overloaded
```

```sh
pnpm add @autometa/overloaded
```

### Function & Method Overloads

Function and method overloads are an elegent way to expose multiple definition signatures
for a function which help intellisense and display more clear intent about the purpose
of your function for a given input.

Imagine a function with the following requirements

- Accepts two values, `a` and `b`
- Both `a` and `b` can be either a `string` or a `number`.
- If `a` is a `string` then `b` must be a `string`.
- If `a` is a `number` then `b` must be a `number`.
- When `a` and `b` are string, return a tuple [a, b]
- When `a` and `b` are numbers, return the sum of the numbers.

This isn't a terribly useful function but that's okay.

The 'simplest' approach is to use discriminated unions <sub>(... aren't they all?)</sub>.

```ts
function add(
  a: string | number,
  b: string | number
): [string, string] | number {
  //  ...
}
```

This is fine but unless the above requirements are documented somewhere the consumer
will not be able to immediately understand how to use this function.

The solution is overloads. To make this function better for our consumer we can
add two new signatures:

```ts
function add(a: string, b: string): [string, string];
function add(a: number, b: number): number;
function add(
  a: string | number,
  b: string | number
): [string, string] | number {
  //  ...
}
```

Now for our consumers this function makes a lot of sense. Once they provide a valid value for `a`, the
types `b` and `return` will automatically be inferred according to our requirements. We can even
document each overload separately.

```ts
/**
 * blah blah blah
 */
function add(a: string, b: string): [string, string];
/**
 * blah blah blah
 */
function add(a: number, b: number): number;
function add(
  a: string | number,
  b: string | number
): [string, string] | number {
  //  ...
}
```

#### Implementing an overload

While our function is nice to use, implementing it is a bit more grueling.
We need to check our types and perform the correct behavior, also accounting
for error states:

```ts
function add(a: string, b: string): [string, string];
function add(a: number, b: number): number;
function add(
  a: string | number,
  b: string | number
): [string, string] | number {
  if (typeof a === "string") {
    if (typeof b === "string") {
      return [a, b];
    } else {
      throw new Error("a & b must both be strings");
    }
  }
  if (typeof a === "number") {
    if (typeof b === "number") {
      return a + b;
    } else {
      throw new Error("a & b must both be numbers");
    }
  }

  throw new Error("unknown types a & b must be string or number");
}
```

For just two variables with two primitive types, this is pretty rough.
We can imagine then how it might look if `a` and `b` can be completely different types from each other - including more complex types like objects and arrays which require even more validation.

At some point the the function parameter list becomes unmaintable
at the base level, which is easily resolved with a rest param.

```ts
function add(a: string, b: string): [string, string];
function add(a: number, b: number): number;
function add(a: [string, boolean], b: MyLibOpts): number;
function add(...args: unknown[]): [string, string] | number {}
```

Okay so how does **_Overloaded_** help?

### Implementing an overload in _Overloaded_

Using overloaded to build your function and method overloads is simple.
Call the `overloads` function with your `param` overloads, then pass
the real arguments.

Overloaded functions are defined by the function pair `params` and it's child function `match`. Params accepts a rest param array of `BaseArguments`.
A `BaseArgument` can be created by it's corresponding function. So `StringArgument` has a `string()` factory function, while `BooleanArgument`
has the factory function `boolean()`. `params` returns an object
containing a `match` function. `match` accepts a function who's parameter
signaure will be inferred from the preceeding `params`.

I.E. for `params(string(), string())`, the `match` callback
will accept exactly 2 arguments which must be strings:

```ts
// ----------------------   V 'a' and 'b' both inferred as 'string'
params(string(), string()).match((a, b)=>}{})
// okay but redundant
params(string(), string()).match((a: string, b: string)=>}{});
// bad - ts error
params(string(), string()).match((a: string, b: number)=>}{});
```

Sticking with our original 2 overloads:

```ts
import { overloads, params, string, number } from "@autometa/overloaded";

function add(a: string, b: string): [string, string];
function add(a: number, b: number): number;
function add(
    // 'unknown' instead of union is also fine here
  ...args: (string | number)[]
){
  return overloads(
    params(string(), string()).match((a, b) => [a, b])
    params(number(), number()).match((a, b) => a + b)
    // if using individual params pass an array [a, b] to `use`
  ).use(args);
}
```

And that's it. We now have an equivelent implementation as what we started with.

The return types for the base function definition will be inferred as a union
of the return types of each `match`. If no matching overload is found, an error will be thrown
highlighting each overload and provided context as to why it was not matched.

In the above example, the inferred return type is `[string, string] | number `

### Arguments

We saw Arguments in our above example. They are factory functions
named approximately the same as their corresponding type.

Some like the above can be called with no additional arguments. Some require additional context.
All argument factories can be named. It is suggested these names match the name
in the corresponding overload. Rewriting the above example:

```ts
import { overloads, params, string, number } from "@autometa/overloaded";
function add(a: string, b: string): [string, string];
function add(a: number, b: number): number;
function add(
  ...args: (string | number)[]
  // ...args: unknown[] // generalized alternative
){
  return overloads(
    params(string('a'), string('b')).match((a, b) => [a, b])
    params(number('a'), number('b')).match((a, b) => a + b)
    // if using individual params pass an array [a, b] to `use`
  ).use(args);
}
```

**Note:** It is not necesary for all overload parameters to share the same names. Likewise it is not necessary oveloaded argument factories to share the same name across overloads.

The name is optional, and is used primarily for context when an error is thrown. If no
name is provided, the arguments index in the parameter list will be used instead.

### Assertions

Assertions are an additional layer of overload matching which can be employed. Validations
mean that Overloaded can have useful applications in non-overloaded functions also. Each
type factory has its own set of validations which can be used. Using string here as an example:

```ts
import { admin, buyer, seller } from "./user-actions";

type UserTypes = "admin" | "buyer" | "seller";

function performUserAction(userType: UserTypes, data: unknown) {
  return overloads(
    params(string("userType", { equals: "admin" }), unknown("data")).match(
      (_userType, data) => {
        return admin.action(data);
      }
    ),
    params(string("userType", { equals: "buyer" }), unknown("data")).match(
      (_userType, data) => {
        return buyer.action(data);
      }
    ),
    params(string("userType", { equals: "seller" }), unknown("data")).match(
      (_userType, data) => {
        return seller.action(data);
      }
    )
  ).use([userType]);
}
```

Congratulations. You have implemented... an over-engineered switch statement!

However there are other checks like 'minLength', 'maxLength', 'startsWith' etc which can be composed together to simplify filtering logic for some domains. Each argument type has it's own assertions.

Assertions can of course also be used within an overloaded function or method to
provide additional filtering.

Assertions are used for filtering, and do not through errors by themselves.

**Note** Some assertions are ignored if an invalid type is passed. For example,
most string assertions will not be executed if a number or boolean or object is
passed. In that case the assertion executed will be on the type itself.

### Fallback

If no overloads match the provided argument an Error will be thrown
detailing why each overload failed to match.

Alternatively it is possible to provide a 'fallback' which
will be executed instead of an error being thrown. The fallback
will recieve a rest param of arguments with types being `unknown`

A Fallback is defined with the `fallback` function.

```ts
import { overloads, params, string, number } from "@autometa/overloaded";

function add(a: string, b: string): [string, string];
function add(a: number, b: number): number;

function add(
  ...args: (string | number)[] // 'unknown' is a union is also fine here
) {
  return overloads(
    params(string(), string()).match((a, b) => [a, b]),
    params(number(), number()).match((a, b) => a + b),
    fallback((...args: unknown[]) => console.log(args))
  ).use(args);
}
```

## Normalize Constructor or function arguments

```ts
declare class MyObject {
  constructor(name: string | undefined, widgets: string[] | undefined);
}
function makeMyClass(name: string): MyObject;
function makeMyClass(widgets: string[]): MyObject;
function makeMyClass(name: string, widgets: string[]): MyObject;
function makeMyClass(...args: (string | string[])[]) {
  return overloads(
    // Create an instance with only a name
    params(string("name")).matches((name) => new MyObject(name)),
    // Create an instance with only its list of widgets
    params(array("widgets", [string()])).matches(
      (name, widgets) => new MyObject(undefined, widgets)
    ),
    // Create an instance with both a name and its list of widgets
    params(string("name"), array("widgets", [string()])).matches(
      (name, widgets) => new MyObject(undefined, widgets)
    ),
    // No match - Throw an error
    fallback((...args) => {
      throw new Error(
        `A 'MyObject' instance requires either a name, a list of widgets or both. Recieved: ${args}`
      );
    })
  ).use(args);
}
```

## Factory Function

Convert a plain javascript object to a DTO instance. Pretend
we have a `plainToDto` function which creates a new instance of a class
and assigns the values from a raw object to its instance properties

```ts
abstract class User {
  name: string;
  registered: Date;
}
class AdminUser extends User {
  permissions: ("read" | "write" | "ban" | "unban" | "sticky")[];
}
class HobbyUser extends User {
  interests: string[];
}
class PaidUser extends User {
  interests: string[];
  tier: number;
  badges: number[];
}

// return type inferred as 
// AdminUser | HobbyUser | PaidUser
// Throws an error if no match found.
function createUserDto(user: unknown) {
  return overloads(
    params(shape({ permissions: array([string()]) })).matches((user) =>
      plainToDto(AdminUser, user)
    ),
    params(shape({ interests: array([string()]) })).matches((user) =>
      plainToDto(HobbuUser, user)
    ),
    params(shape({ tier: number() })).matches((user) =>
      plainToDto(PaidUser, user)
    )
  ).use([user]);
}
```

## Argument Types

### Primitives

The "primitives", `string`, `number` and `boolean` are represented by factories
of matching name. Each accepts a name and assertion options.

#### **String**

Matches an argument in the same position which is a string.

```ts
params(string("a")).matches((a) => `Foo: ${a}`);
```

Assertions:

_equals_: Asserts that two strings are exactly equal

```ts
params(string("a", { equals: "user" })).matches((a) => UserFactory);
```

_minLength_: Asserts that any string passed will have at _least_ `n` characters (inclusive), where `n` is the value passed to `minLength`

```ts
params(string("a", { minLength: 10 })).matches((a) => `Foo: ${a}`);
// name is optional
params(string({ minLength: 10 })).matches((a) => `Foo: ${a}`);
```

_maxLength_: Asserts that any string passed will have at _most_ `n` characters (inclusive),
where `n` is the value passed to `minLength`

```ts
params(string("a", { maxLength: 10 })).matches((a) => `Foo: ${a}`);
```

_includes_: Asserts that any string passed includes some substring.

```ts
params(string("a", { includes: "users" })).matches((a) => usersFactory(a));
```

_startsWith_: Asserts that a string starts with a specific substring.

```ts
params(string("a", { startsWith: "users" })).matches((a) => mySettings[a]);
```

_endsWith_: Asserts that a string ends with a specific substring.

```ts
params(string("a", { endsWith: "users" })).matches((a) => mySettings[a]);
```

_in_: Asserts that a string is part of an array.

```ts
params(string("a", { in: ["group1", "group2"] })).matches((a) =>
  this.getGroup(a)
);
```

#### **Number**

Matches a parameter which of type `number`.

Assertions:

_min_: Asserts that a number has at least some minimum value (inclusive)

```ts
params(number("a", { min: 0 })).matches((a) => myArray[a]);
```

_max_: Asserts that a number has at most some maximum value (inclusive)

```ts
params(number("a", { max: 0 })).matches((a) => throw new Error(`'a' must be positive`));
```

_in_: Asserts that a number is part of an array.

```ts
params(string("a", { in: [101, 102] })).matches((a) =>
  this.courses.enroll.math(a)
);
```

_equals_: Asserts that the provided number is exactly equal to the expected.

```ts
params(string("a", { equals: 101 })).matches((a) => DalmationCoatFactory);
```

_types_: Asserts that the provided value is either an integer
or a float value.

```ts
params(string("a", { type: "float" })).matches((a) => a * MY_CONST);
params(string("a", { type: "int" })).matches((a) => MY_ENUM[a]);
```

**boolean** assertions

- equals

### Arrays and Tuples

Arrays and tuples are similar to each other, but arrays
accept a list of possible type options with indeterminate
length (unless asserted against), while a tuple is an array
of fixed length with deterministic type options.

**array**

```ts
params(array([string(), number()])).match((a: (string | number)[]) => {
  // ...
});
```

**Assertions**

- minLength
- maxLength
- includes

**tuple**

```ts
params(tuple([string(), number()])).match((a: [string, number]) => {
  // ...
});
```

**Assertions**

- includes

### Shapes

Shapes represent anonymous objects and class instances. It accepts
an object whos keys match the expected object and whos values
are Argument types. By default, only properties with keys defined in the `shape`
will be used to match.
If the real value passed to the overloaded function contains additional
keys, they will not be considered for validation, unless the `exhaustive` option is set to true.

```ts
params(shape({ a: string(), b: tuple([number(), boolean()]) })).match(
  ({ a, b }) => {
    console.log(a);
    console.log(b[0]);
    console.log(b[1]);
  }
);
```

**Assertions**

- exhaustive
  - If true, validation of an overload will fail if the recieved argument has keys which are not defined by the overload.
- instance
  - A Class blueprint/prototype from which the provided value should be extended.

### Function

Functions have minimal validation, providing only a shape
and an optional argument list length.

```ts
params(func<(a: string) => void>()).match((fn) => fn("hi"));
```

**Assertions**

- length
  - The expected length of the parameter list.

### Unknown

Catch-all/wildcard argument with no typing. Will check if the value
is defined, which can be overwritten.

```ts
params(string(), unknown(), number()).match(
  (a: string, b: unknown, c: number) => {
    // ...
  }
);
```

### Date

Matches an instance of the Node `Date` class.

```ts
import { yesterdayDate } from "./my-date-utils";

params(date({ before: yesterdayDate() })).match((a: Date) => {
  // ...
});
```

**Assertions**

- before
  - Checks that this provided date is chronoligically earlier than the configured date
- after
  - Checks that this provided date is chronoligically later than the configured date
- equal
  - Checks that this provided date is chronoligically equal to the configured date

### Instance

Matches an argument which is an instance of a provided class (also referred to here as a blueprint). Optionally accepts a `shape`, which is used to validate the individual
properties of the instance.

```ts
params(instance(MyClass, shape({ name: string(), age: number() }))).match(
  (a: MyClass) => {
    // ...
  }
);
```

Instance assertions can be defined in the `shape` argument.
