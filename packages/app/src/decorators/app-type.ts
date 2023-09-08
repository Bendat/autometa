import { Class } from "@autometa/types";
import { Lifecycle } from "tsyringe";
import { Fixture } from "./fixture";


export function AppType(
  container: Record<string, { app: unknown; world: unknown; }>,
  world: Class<Record<string, unknown>>,
  environment = "default"
) {
  const env = environment ?? "default";
  return (target: Class<unknown>) => {
    Fixture(Lifecycle.ContainerScoped)(target);
    container[env] = { app: target, world };
  };
}
