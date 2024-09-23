import { PARAM_REGISTRY } from "./parameters";
import { GetCucumberFunctions, Pass } from "@autometa/scopes";
import { Coordinator } from "@autometa/coordinator";
import { CONFIG } from "./config";
import { makeTestEmitter } from "./events";
import { executor } from "./executor";
import { OPTS } from "./app";
const {
  BeforeFeature,
  AfterFeature,
  BeforeScenarioOutline,
  AfterScenarioOutline,
  BeforeExamples,
  AfterExamples,
  BeforeRule,
  AfterRule,
  Feature,
  Scenario,
  ScenarioOutline,
  Rule,
  Given,
  When,
  Then,
  Before,
  After,
  Teardown,
  Setup,
  Global,
} = GetCucumberFunctions(PARAM_REGISTRY);
const coordinator = new Coordinator(Global, CONFIG, OPTS);
Global.onFeatureExecuted = (feature, caller) => {
  const groupLogger = CONFIG.current.test?.groupLogging ?? false;
  const events = makeTestEmitter({ groupLogger });
  coordinator.run(feature, caller, events, executor);
};

export {
  Feature,
  Scenario,
  ScenarioOutline,
  Rule,
  Given,
  When,
  Then,
  Before,
  After,
  Teardown,
  Setup,
  BeforeFeature,
  AfterFeature,
  BeforeScenarioOutline,
  AfterScenarioOutline,
  BeforeExamples,
  AfterExamples,
  BeforeRule,
  AfterRule,
  Pass,
};
