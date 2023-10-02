import "@autometa/types";
import { AppType as at } from "@autometa/app";
import { CoordinatorOpts } from "@autometa/coordinator";
export {
  Fixture,
  LIFE_CYCLE,
  Lifecycle,
  AutometaApp,
  AutometaWorld
} from "@autometa/app";
export const OPTS = {} as Record<string, CoordinatorOpts>;
export const AppType = at.bind(null, OPTS);
