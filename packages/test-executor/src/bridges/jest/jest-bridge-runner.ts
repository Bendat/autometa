import { ScenarioOutline } from "@autometa/gherkin";
import { TestExecutorConfig } from "../../config.schema";
import { FeatureBridge } from "../bridge";
import { JestFeatureScenarioRunner } from "./jest-feature-scenario-bridge";

export class JestBridgeRunner {
  constructor(private config: TestExecutorConfig) {}
  runFeature(feature: FeatureBridge) {
    for (const scenario of feature.scenarios) {
      const { gherkin } = scenario.data;
      if (gherkin instanceof ScenarioOutline) {
        continue;
      }
      const runner = new JestFeatureScenarioRunner(this.config, feature, scenario);
      runner.runScenario();
    }
  }
}
