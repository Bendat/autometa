import "@autometa/types";
import { AppType as at } from "@autometa/app";
import { CoordinatorOpts } from "@autometa/coordinator";
export const OPTS = {} as Record<string, CoordinatorOpts>;
export const AppType = at.bind(null, OPTS);
