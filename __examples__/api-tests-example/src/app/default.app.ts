import { AppType } from "@autometa/runner";
import { World } from "./default.world";
import { API } from "../controllers/api";

@AppType(World)
export class App {
  constructor(readonly api: API) {}
}
