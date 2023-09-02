/* eslint-disable @typescript-eslint/no-empty-interface */

import type { DefaultApp } from "./src";

declare module "@autometa/app" {
  export interface App extends DefaultApp {}
}
