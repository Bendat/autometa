import { Config } from "../config/config-manager";
import { Class } from "../type-extensions/class";
import { container, InjectionToken } from "tsyringe";

export function getApp<T>(...instances: { token: InjectionToken<unknown>; instance: unknown }[]) {
  const app = Config.get<Class<T> | undefined>("app");
  if (!app) {
    return undefined;
  }
  const child = container.createChildContainer();
  instances.forEach(({ token, instance }) => child.registerInstance(token, instance));
  return child.resolve(app);
}
