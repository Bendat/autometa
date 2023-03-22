# DTO and Builder Pattern

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
userBuilder.id('1').name("bob").age(23);

// Bypass
userBuilder.id('1' as unknown as number).name("bob").age(23);



```

You can also pass in an already existing DTO and build it
further.

```ts
const cachedUser = new UserDto()
const userBuilder = new UserBuilder(cachedUser);
```
