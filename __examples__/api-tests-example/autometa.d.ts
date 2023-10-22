/* eslint-disable @typescript-eslint/no-empty-interface */
import type { App as A, World as W, Types as T } from "./src";

declare module "@autometa/runner" {
  export interface App extends A {}
  export interface World extends W {}
  export interface Types extends T {}
}
