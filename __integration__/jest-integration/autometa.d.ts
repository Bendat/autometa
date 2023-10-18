/* eslint-disable @typescript-eslint/no-empty-interface */

import type { DefaultApp, World as W, Foo } from "./src";
declare module "@autometa/app" {
  export interface App extends DefaultApp {
    world: W;
  }
  export interface World extends W {}
}

declare module "@autometa/scopes" {
  export interface Types {
    snoob: number;
    "class:foo": Foo;
  }
}
