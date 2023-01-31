import { Fixture, Persistent } from "../di/decorators";
import { DefaultWorld } from "./default-world";

@Fixture
@Persistent
export class DefaultApp {
  constructor(readonly world: DefaultWorld) {}
}
