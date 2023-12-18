import { World } from "./fixtures.typings";
export abstract class AutometaApp {
  id: string;
  [key: string]: unknown;
  world: World;
}
