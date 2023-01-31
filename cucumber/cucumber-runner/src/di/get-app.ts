import { Config } from "../config/config-manager";
import { Class } from "@typing/class";
import { container } from "tsyringe";

export function getApp<T extends Class<T>>() {
  const app = Config.get<T | undefined>("app");
  if (!app) {
    return undefined;
  }
  return container.createChildContainer().resolve(app);
}
