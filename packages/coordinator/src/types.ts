import { Class } from "@autometa/types";
import { AutometaApp, AutometaWorld } from "@autometa/app";
import { DependencyContainer } from "tsyringe";
export type CoordinatorOpts = {
  app: Class<AutometaApp>;
  world: Class<AutometaWorld>;
  container: DependencyContainer;
};
