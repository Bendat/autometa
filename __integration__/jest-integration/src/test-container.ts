import { Fixture } from "@autometa/runner";

@Fixture
export class TestContainer {
  [key: string]: unknown;
  steps: number[] = [];
}
