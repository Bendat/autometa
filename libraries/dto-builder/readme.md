# DTO and Builder Pattern

[Full documentation](https://bendat.github.io/autometa/docs/libraries/dto-builder/intro)
This library allows defining DTO classes with decoratated properties.
You an then automatically create a new builder class that incrementally
assigns the value of the DTO, and returns the built result.

:::caution
This library requires experimental decorators and a reflect polyfill
like [reflect-metadata](https://www.npmjs.com/package/reflect-metadata)
:::

## Installation

```sh title=npm
    npm i -D @autometa/dto-builder
```

```sh title=yarn
    yarn add -D @autometa/dto-builder
```

```sh title=pnpm
    pnpm add -D @autometa/dto-builder
```

## Use

### Creating a DTO

To create a DTO, simply create a class which matches the data type your
representing. Then, decorate its properties with the `@Property` decorator.

```ts
import { Property } from "@autometa/dto-builder";

export class UserDto {
  @Property
  id: number;
  @Property
  name: string;
  @Property
  age: number;
}
```

### Creating a builder

Now that we have a DTO, we can make a builder for it. Simply pass
your DTO class prototype to the `Builder` function. It will return a new
class whos interface matches the DTO, but with functions accepting a value
instead of raw properties.

The builder functions are compile-time type safe but do no
run time validation.

If the `class validator` package is installed, the DTO will be validated on build. This can be bypassed by passing `false` to the build method

```ts
import { Builder } from "@autometa/dto-builder";
import { UserDto } from "./user-dto";

const UserBuilder = Builder(UserDto);

const userBuilder = new UserBuilder();
userBuilder.id(1).name("bob").age(23);
// methods are type safe
// -------------
// error       |
//             V
userBuilder.id("1").name("bob").age(23);

// Bypass
userBuilder
  .id("1" as unknown as number)
  .name("bob")
  .age(23);
```

You can also pass in an already existing DTO and build it
further.

```ts
const cachedUser = new UserDto();
const userBuilder = new UserBuilder(cachedUser);
```

# Default Values

You can pass a value into the Property decorator to provide a default value.
The default value will be injected by the Builder class.

```ts
import { Property } from "@autometa/dto-builder";

export class UserDto {
  @Property(100)
  id: number;
  @Property("paul")
  name: string;
  @Property(20)
  age: number;
}

const user = new UserBuilder().build();

console.log(user.id === 100); // true
console.log(user.name === "paul"); // true
console.log(user.age === 20); // true
```

## Nesting DTOs

For complex classes with nested classes or objects it is adiviseable to use a type
or interface rather than a Dto type.

```ts
// prefer not
class InnerDto {
  @Property
  value: number;
}

class OutterDto {
  @Property
  inner: InnerDto;
}

// prefer
interface Inner {
  value: number;
}

class InnerDto {
  @Property
  value: number;
}

class OutterDto {
  @Property
  inner: Inner;
}
```

To make a DTO available for nesting, pass its prototype to the Property decorator
as its default value. Note, this is the prototype, not an instance.

```ts

// prefer
interface Inner {
    value: number
}

class InnerDto {
  @Property(1)
  value: number;
}

class OutterDto {
  @Property(InnerDto)
  inner: Inner;
}

const outter = new OuterBuilder().build()
console.log(outer.inner instanceOf InnerDto); // true
console.log(outer.innerr.value === 1); // true
```


You can also create a unique dto with default values by calling the static `default`
method on your builder

```ts
const outter = OuterBuilder.default();
```

For many tests, valid default values may be all you need on your dto. If
you wish to make further edits you can pass the instance to a builder later

```ts
new OuterBuilder(outter).inner(new InnerBuilder().value(1).build());
```

Note that this will mutate the original dto. You do not need to reassign it or
even `build` it.

# DTO From Raw Object

Sometimes it's necessary to convert a raw object into a DTO. This can be achieved by
calling `fromRaw` on the Builder class, passing it the raw object.

```ts
const raw = { outter: { inner: { value: 1 } } };
const dto = OutterBuilder.fromRaw(raw);

expect(dto).toBeInstanceOf(Outter);
```

## Tranforming raw values

If a raw value should be further processed, a transformation function
can be provided. For example, if a string should be converted to a date,
`Date.parse` can be provided.

```ts
@Property(Date.parse)
created: Date

// wrapping function
@Property(<string>(value) => Date.parse(value))
created: Date
```
