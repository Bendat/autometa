import { getApp } from "@autometa/app";
import { AutomationError } from "@autometa/errors";
import { EventSubscriber } from "@autometa/events";
import { StatusType } from "@autometa/types";
import { TestExecutorConfig } from "../../config.schema";
import { FeatureBridge, ScenarioBridge } from "../bridge";

export class JestFeatureScenarioRunner {
  constructor(
    private config: TestExecutorConfig,
    private feature: FeatureBridge,
    private scenario: ScenarioBridge,
    private events?: EventSubscriber
  ) {}

  runScenario() {
    const { describe, test, beforeAll, beforeEach, afterAll, afterEach } = this.config.runner;
    const { scope: featureScope, gherkin: featureGherkin } = this.feature.data;
    const { scope: scenarioScope, gherkin: scenarioGherkin } = this.scenario.data;
    if (featureScope.skip) {
      this.events?.onFeatureStart?.({
        title: featureScope.title(featureGherkin),
        path: featureGherkin.uri,
        tags: featureGherkin.tags,
      });
      this.events?.onFeatureEnd?.({
        title: featureScope.title(featureGherkin),
        status: "SKIPPED",
      });
    }
    const group = featureScope.skip === true ? describe.skip : describe;
    group(featureScope.title(featureGherkin), () => {
      const app = getApp(this.config.cucumber.app);
      const topLevelApp = getApp(this.config.cucumber.app);
      let lastStatus: StatusType;
      let lastError: AutomationError;
      beforeAll(() => {
        this.events?.onFeatureStart?.({
          title: featureScope.title(featureGherkin),
          path: featureGherkin.uri,
          tags: featureGherkin.tags,
        });
      });
      featureScope.hooks.setup.forEach((hook) => {
        beforeAll(async () => {
          await hook.execute(topLevelApp);
        });
      });
      featureScope.hooks.before.forEach((hook) => {
        beforeEach(async () => {
          await hook.execute(app);
        });
      });
      featureScope.hooks.after.forEach((hook) => {
        afterEach(async () => {
          await hook.execute(app);
        });
      });
      featureScope.hooks.teardown.forEach((hook) => {
        afterAll(async () => {
          await hook.execute(topLevelApp);
        });
      });
      afterAll(() => {
        this.events?.onFeatureEnd?.({
          title: featureScope.title(featureGherkin),
          status: lastStatus,
          error: lastError,
        });
      });
      if (scenarioScope.skip) {
        lastStatus = "SKIPPED";
      }
      const it = scenarioScope.skip === true ? test.skip : test;
      it(scenarioScope?.title(scenarioGherkin), async () => {
        if (!scenarioScope) throw new Error("Scenario scope is undefined. This shouldn't happen.");

        const steps = this.scenario.steps;
        for (const step of steps) {
          const { gherkin: stepGherkin, scope: stepScope } = step.data;
          const args = stepScope.getArgs(stepGherkin.text);
          const result = await stepScope.execute(stepGherkin, args, app);
          if (result instanceof AutomationError && result.opts) {
            this.#throwOnError(scenarioScope.title(scenarioGherkin), result, (e) => {
              lastError = e;
              lastStatus = "FAILED";
              e.opts.feature = this.feature.data.gherkin;
              e.opts.scenario = scenarioGherkin;
              e.opts.step = stepGherkin;
            });
          }
          lastStatus = "PASSED";
        }
      });
    });
  }
  #throwOnError(title: string, e: Error | undefined, onFinally: (e: AutomationError) => unknown) {
    if (e && e instanceof Error) {
      const newError = new AutomationError(`${title} failed while executing a step:
    
  ${e.message}`);
      newError.opts.cause = e;
      newError.stack = e.stack;
      onFinally(newError);
      throw newError;
    }
  }
}
