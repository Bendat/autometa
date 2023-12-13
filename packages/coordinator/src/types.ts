import { Class } from "@autometa/types";
import { App, World } from "@autometa/app";
export type CoordinatorOpts = {
  app: Class<App>;
  world: Class<World>;
};
