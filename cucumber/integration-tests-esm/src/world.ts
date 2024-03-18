import { Fixture, Persistent } from "@autometa/cucumber-runner";
@Fixture
@Persistent
export class World {
  [key: string]: unknown;
}
