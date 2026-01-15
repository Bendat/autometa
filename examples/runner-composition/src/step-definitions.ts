import { CucumberRunner } from "@autometa/core/runner";
import type { HookLifecycleMetadata } from "@autometa/core/executor";

import {
  runnerCompositionWorldDefaults,
  type LifecycleStepRecord,
  type RunnerCompositionWorldBase,
  type RunnerCompositionWorld,
  type StepLifecycleStatus,
} from "./world";
import { CompositionRoot } from "./composition/http-app";

const lifecycleLoggingEnabled = (() => {
  const rawValue =
    process.env.AUTOMETA_LIFECYCLE_DEBUG ??
    process.env.AUTOMETA_LIFECYCLE_LOGS ??
    process.env.AUTOMETA_DEBUG ??
    "";
  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return !["0", "false", "no", "off"].includes(normalized);
})();

function writeLifecycleLog(
  logger: ((message: string) => void) | undefined,
  message: string
): void {
  if (!lifecycleLoggingEnabled) {
    return;
  }
  if (logger) {
    logger(message);
    return;
  }
  console.info(message);
}

const runner = CucumberRunner.builder()
  .withWorld<RunnerCompositionWorldBase>(runnerCompositionWorldDefaults)
  .app(CompositionRoot);

export const stepsEnvironment = runner.steps();

export const {
  Given,
  When,
  Then,
  And,
  But,
  BeforeScenario,
  AfterScenario,
  BeforeScenarioOutline,
  AfterScenarioOutline,
  BeforeStep,
  AfterStep,
  BeforeFeature,
  AfterFeature,
  ensure,
} = stepsEnvironment;

BeforeFeature(({ world, scope, log }) => {
  world.lifecycle.featureName = scope.name;
  world.lifecycle.beforeFeatureRuns += 1;
  writeLifecycleLog(log, `Preparing "${scope.name}"`);
});

AfterFeature(({ world, log }) => {
  world.lifecycle.afterFeatureRuns += 1;
  writeLifecycleLog(log, `Finished "${world.lifecycle.featureName ?? "<unknown>"}"`);
});

BeforeScenario(({ world, scope, metadata, log }) => {
  const details = (metadata ?? {}) as HookLifecycleMetadata;
  const scenarioName = details.scenario?.name ?? scope.name;
  if (!world.lifecycle.scenarioOrder.includes(scenarioName)) {
    world.lifecycle.scenarioOrder.push(scenarioName);
  }
  writeLifecycleLog(log, `Scenario "${scenarioName}" ready`);
});

AfterStep(({ world, scope, metadata, log }) => {
  const details = (metadata ?? {}) as HookLifecycleMetadata;
  const scenarioName = details.scenario?.name ?? scope.name;
  const step = details.step;
  if (!step) {
    return;
  }

  const keyword = step.keyword?.trim() ?? "";
  const text = step.text ?? "";
  const label = keyword
    ? `${keyword}${text.startsWith(" ") ? "" : " "}${text}`
    : text || `${step.keyword ?? "Step"} #${step.index ?? 0}`;

  const entry: LifecycleStepRecord = {
    scenario: scenarioName,
    step: label,
    status: (step.status as StepLifecycleStatus | undefined) ?? "passed",
  };

  world.lifecycle.stepHistory.push(entry);
  writeLifecycleLog(log, `Scenario "${scenarioName}" :: ${label} (${entry.status})`);
});

export type { RunnerCompositionWorld };
