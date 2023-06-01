import { container } from "tsyringe";
import { AutometaApp } from "./autometa-app";
import { Class } from "@autometa/types";
import { AutomationError } from "@autometa/errors";

export function getApp<T extends AutometaApp>(appType: Class<T>) {
  if (!appType) {
    throw new AutomationError(`A reference to an 'app' is required to run tests.

Configure the app by extending 'AutometaApp' and adding it to your
'autometa.config.ts' file:
export class MyAutometaApp extends AutometaApp {
    ...
}
defineConfig({
    app: MyAutometaApp,
    ...
})`);
  }
  const child = container.createChildContainer();
  //   instances.forEach(({ token, instance }) => child.registerInstance(token, instance));
  return child.resolve(appType);
}
