import type {
  EndAfterOpts,
  EndBeforeOpts,
  EndFeatureOpts,
  EndRuleOpts,
  EndScenarioOpts,
  EndSetupOpts,
  EndStepOpts,
  EndTeardownOpts,
  EventSubscriber,
  StartAfterOpts,
  StartBeforeOpts,
  StartFeatureOpts,
  StartRuleOpts,
  StartScenarioOpts,
  StartScenarioOutlineOpts,
  StartSetupOpts,
  StartStepOpts,
  StartTeardownOpts,
} from "../events";

export class LoggerSubscriber implements EventSubscriber {
  onFeatureStart = (opts: StartFeatureOpts) => {
    console.log(`Starting Feature: ${opts.title}`);
  };
  onFeatureEnd = (opts: EndFeatureOpts) => {
    console.log(`Ending Feature: ${opts.title}`);
  };
  onRuleStart = (opts: StartRuleOpts) => {
    console.log(`Starting Rule: ${opts.title}`);
  };
  onRuleEnd = (opts: EndRuleOpts) => {
    console.log(`Ending Rule: ${opts.title}`);
  };
  onScenarioOutlineStart = (opts: StartScenarioOutlineOpts) => {
    console.log(`Starting Scenario Outline: ${opts.title}`);
  };
  onScenarioOutlineEnd = (opts: EndScenarioOpts) => {
    console.log(`Ending Scenario Outline: ${opts.title}`);
  };
  onScenarioStart = (opts: StartScenarioOpts) => {
    console.log(`Starting Scenario: ${opts.title}`);
  };
  onScenarioEnd = (opts: EndScenarioOpts) => {
    console.log(`Ending Scenario: ${opts.title}`);
  };
  onStepStart = (opts: StartStepOpts) => {
    console.log(`Starting Step: ${opts.keyword} ${opts.text}`);
  };
  onStepEnd = (opts: EndStepOpts) => {
    console.log(`Ending Step: ${opts.text}`);
  };
  onSetupStart = (opts: StartSetupOpts) => {
    console.log(`Starting Setup: ${opts.description}`);
  };
  onSetupEnd = (opts: EndSetupOpts) => {
    console.log(`Ending Setup: ${opts.description}`);
  };
  onTeardownStart = (opts: StartTeardownOpts) => {
    console.log(`Starting Teardown: ${opts.description}`);
  };
  onTeardownEnd = (opts: EndTeardownOpts) => {
    console.log(`Ending Teardown: ${opts.description}`);
  };
  onBeforeStart = (opts: StartBeforeOpts) => {
    console.log(`Starting Before: ${opts.description}`);
  };
  onBeforeEnd = (opts: EndBeforeOpts) => {
    console.log(`Ending Before: ${opts.description}`);
  };
  onAfterStart = (opts: StartAfterOpts) => {
    console.log(`Starting After: ${opts.description}`);
  };
  onAfterEnd = (opts: EndAfterOpts) => {
    console.log(`Ending After: ${opts.description}`);
  };
}
