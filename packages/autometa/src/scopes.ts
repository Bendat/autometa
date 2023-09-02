import { PARAM_REGISTRY } from "./parameters";
import { GetCucumberFunctions, Scopes, Pass } from "@autometa/scopes";
import { Coordinator } from "@autometa/coordinator";
import { CONFIG } from "./config";
import { makeTestEmitter } from "./events";
import { executor } from "./executor";
import { OPTS } from "./app";
const {
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
  Global
}: Scopes = GetCucumberFunctions(PARAM_REGISTRY);

const coordinator = new Coordinator(Global, CONFIG, OPTS);

Global.onFeatureExecuted = (feature, caller) => {
  const events = makeTestEmitter();
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
  Pass
};
