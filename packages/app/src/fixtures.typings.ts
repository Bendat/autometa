/* eslint-disable @typescript-eslint/no-empty-interface */

import type { AutometaApp } from "./autometa-app";
import type { AutometaWorld } from "./autometa-world";

export interface World extends AutometaWorld {}
export interface App extends AutometaApp {
  world: World;
}
