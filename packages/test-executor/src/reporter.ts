import { Reporter, TestContext } from "@jest/reporters";
import { AggregatedResult } from "@jest/test-result";
import { Config } from "@jest/types";

type CustomReporter = Pick<Reporter, "onRunComplete">;

export default class TestReporter implements Reporter
{
  // Add the config to our constructor
  constructor(private config: Config.InitialOptions) {}

  onRunComplete(context: Set<TestContext>, results: AggregatedResult) {
    const isCi = this.config.ci

    // Only run in a CI environment    
    if (isCi) {
      console.log(results);
    }
  }
}