import { AppType, Constructor } from "@autometa/runner";
import { World } from "./default.world";
import { API } from "../controllers/api";

@AppType(World)
@Constructor(API)
export class App {
  constructor(readonly api: API) {}
}
