import { container } from "tsyringe";
import { AutometaApp } from "./autometa-app";
import { Class } from "@autometa/types";
import { AutomationError } from "@autometa/errors";
import { AutometaWorld } from ".";
import { v4 } from "uuid";

export function getApp<T extends AutometaApp, K extends AutometaWorld>(
  appType: Class<T>,
  worldType: Class<K>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...instances: { token: any; instance?: any; cls?: Class<any> }[]
) {
  if (!appType) {
    throw new AutomationError(`A reference to an 'app' and 'world' is required to run tests.

Configure the app by extending 'AutometaApp' and adding it to your
'autometa.config.ts' file:

@AppType(MyWorld)
export class MyAutometaApp extends AutometaApp {
    ...
}
defineConfig({
   roots: {
    app: './src/app'
   }
})`);
  }
  instances.forEach(({ token, instance, cls }) =>
    child.register(token, instance ?? cls)
  );

  const child = container.createChildContainer();
  const app = child.resolve(appType);
  app.world = child.resolve(worldType);
  app.id = v4();
  return app;
}
