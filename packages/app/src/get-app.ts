import { AutometaApp } from "./autometa-app";
import { Class } from "@autometa/types";
import { v4 } from "uuid";
import { Container, defineContainerContext } from "@autometa/injection";
import { App } from "./fixtures.typings";

export function getApp<T extends AutometaApp>(
  appType: Class<T>,
  containerName = v4()
): App {
  const context = defineContainerContext(containerName);
  const container = new Container(context);
  const app = container.get<App>(appType);
  app.di = container;
  return app;
}
