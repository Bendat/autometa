# Introduction

Simple library providing access to Http Status codes and phrase texts.

```
npm add @autometa/status-codes
```

# Use

```ts
import { StatusCodes } from "@autometa/status-codes";

console.log(StatusCodes.OK.status); // 200
console.log(StatusCodes.OK.statusText); // 'OK'
```

`StatusCodes` is an `as const` object, making its values visible in the text editor
