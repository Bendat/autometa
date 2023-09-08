/* eslint-disable @typescript-eslint/no-empty-interface */

import type { App as OurApp, World as OurWorld } from "./src";

declare module "@autometa/app" {
  export interface App extends OurApp {}
  export interface World extends OurWorld {}
}
