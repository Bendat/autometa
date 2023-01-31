import { Fixture, Persistent } from "../di/decorators";

@Fixture
@Persistent
export class DefaultWorld {
  [key: string]: unknown;
}
