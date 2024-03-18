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

class UserBuilder extends Builder(UserDto);

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
import { DTO } from "@autometa/dto-builder";

export class UserDto {
  @DTO.value(100)
  id: number;
  @DTO.value("paul")
  name: string;
  @DTO.value(20)
  age: number;
}

const user = new UserBuilder().build();

console.log(user.id === 100); // true
console.log(user.name === "paul"); // true
console.log(user.age === 20); // true
```

Factories can also be used:

```ts
import { Property } from "@autometa/dto-builder";

export class UserDto {
  @DTO.factory(() => Math.random())
  id: number;
  @DTO.factory(() => "paul")
  name: string;
  @DTO.factory(() => 20)
  age: number;
}
```

Note: factories must by synchronous.

## Nesting DTOs

For complex classes with nested classes or objects it is advisable to use a type
or interface rather than a Dto type.

```ts
// prefer not
class InnerDto {
  value: number;
}

class OuterDto {
  @DTO.dto(InnerDto)
  inner: InnerDto;
}

// prefer
interface Inner {
  value: number;
}

class InnerDto implements Inner {
  value: number;
}

class OuterDto {
  @DTO.dto(InnerDto)
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
  @DTO.value(1)
  value: number;
}

class OuterDto {
  @DTO.value(InnerDto)
  inner: Inner;
}

const Outer = new OuterBuilder().build()
console.log(outer.inner instanceOf InnerDto); // true
console.log(outer.innerr.value === 1); // true
```

You can also create a unique dto with default values by calling the static `default`
method on your builder

```ts
const Outer = OuterBuilder.default();
```

For many tests, valid default values may be all you need on your dto. If
you wish to make further edits you can pass the instance to a builder later

```ts
new OuterBuilder(Outer).inner(new InnerBuilder().value(1).build());
```

Note that this will mutate the original dto. You do not need to reassign it or
even `build` it.

## Dates

The `date` decorator will create a new date object for that property
when the builder is instantiated. If a unix timestamp or parseable
string is passed, it will be used to create the date.

```ts
import { DTO } from "@autometa/dto-builder";

export class UserDto {
  @DTO.date
  createdAt: Date;
}

// with unix timestamp

export class UserDto {
  @DTO.date(1620000000000)
  createdAt: Date;
}

// with string

export class UserDto {
  @DTO.date("2021-05-02T00:00:00.000Z")
  createdAt: Date;
}
```

## Interfaces - reducing duplication

If you define your types initially as interfaces, or generate interfaces from
validation libraries like `zod` and `myzod`, you can reduce duplication by
extending the `DTO` function with an interface.

```ts
import { DTO } from "@autometa/dto-builder";

interface IUser {
  id: number;
  name: string;
  age: number;
}

export class UserDto extends DTO<IUser> {}

const user = new UserBuilder().id(0).name("bob").build();
```

# DTO From Raw Object

Sometimes it's necessary to convert a raw object into a DTO. This can be achieved by
calling `fromRaw` on the Builder class, passing it the raw object.

```ts
const raw = { Outer: { inner: { value: 1 } } };
const dto = OuterBuilder.fromRaw(raw);

expect(dto).toBeInstanceOf(Outer);
```

## Interfaces - Anonymous Object Builders

It might not be desirable to build your object as a class. When not used
to extend a class, the `DTO` function will return an anonymous object builder,
with the same interface as the class builder.

```ts
import { Builder } from "@autometa/dto-builder";

interface IUser {
  id: number;
  name: string;
  age: number;
}

const UserBuilder = Builder<IUser>();
```

### Deriving a builder and default values

Since anonymous objects cannot be decorated, they cannot
accept default values or factories which might change between
instantiations.

To work around this, an anonymous builder is `derivable`. Any values
assigned to the builder will stay until the builder is built. However
when the `derive` method is called, a new builder will be created,
copying the values from the original. If those values are set agin
in the derived builder, they will not affect the original.

```ts
const bobBuilder = new UserBuilder().id(1).name("bob").age(23);

const olderBobBuilder = bobBuilder.derive().age(24);
```
