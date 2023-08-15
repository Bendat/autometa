import { container } from "tsyringe";
import { AutometaApp } from "./autometa-app";
import { Class } from "@autometa/types";
import { AutomationError } from "@autometa/errors";
import { AutometaWorld } from ".";

export function getApp<T extends AutometaApp, K extends AutometaWorld>(
  appType: Class<T>,
  worldType: Class<K>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...instances: { token: any; instance?: any; cls?: Class<any> }[]
) {
  if (!appType || !(appType instanceof AutometaApp)) {
    throw new AutomationError(`A reference to an 'app' and 'world' is required to run tests.

Configure the app by extending 'AutometaApp' and adding it to your
'autometa.config.ts' file:
export class MyAutometaApp extends AutometaApp {
    ...
}
defineConfig({
    app: MyAutometaApp,
    world: MyWorldApp
    ...
})`);
  }
  container.registerType(worldType, worldType);
  instances.forEach(({ token, instance, cls }) =>
    instance
      ? child.registerInstance(token, instance)
      : cls
      ? child.registerType(token, cls)
      : null
  );

  const child = container.createChildContainer();
  const app = child.resolve(appType);
  app.world = child.resolve(worldType);
  return app;
}
