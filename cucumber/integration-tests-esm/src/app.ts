import { Fixture, Persistent } from "@autometa/cucumber-runner";
import { World } from "./world";
@Fixture
@Persistent
export class App {
  constructor(readonly world: World) {}
}
