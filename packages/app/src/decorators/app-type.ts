import { Class } from "@autometa/types";
import { App, World, AutometaWorld } from "..";
import { metadata } from "@autometa/injection";
export function AppType(
  container: Record<string, { app: Class<App>; world: Class<World> }>,
  world: Class<AutometaWorld>,
  environment = "default"
) {
  const env = environment ?? "default";
  return (target: Class<unknown>) => {
    metadata(target).set({
      key: "world",
      class: world,
    });
    container[env] = {
      app: target as Class<App>,
      world: world as Class<World>,
    };
  };
}
