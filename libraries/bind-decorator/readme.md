# Introduction

Binds the `this` keyword on a class method.

This is a fork of [bind-decorator](https://www.npmjs.com/package/bind-decorator) for use with Autometa.

```
npm add @autometa/bind-decorator
```

# Use

```ts
import { Bind } from "@autometa/bind-decorator";

class Foo {
  @Bind
  a() {
    // this.doStuff()
  }
}
```
