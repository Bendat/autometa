import { Fixture } from "@autometa/app";

@Fixture()
export class TestContainer {
  [key: string]: unknown;
  steps: number[] = [];
  
}
