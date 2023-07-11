import { AllureConfig, Status } from "allure-js-commons";
import type {
  EndAfterOpts,
  EndBeforeOpts,
  EndFeatureOpts,
  EndRuleOpts,
  EndScenarioOpts,
  EndSetupOpts,
  EndStepOpts,
  EndTeardownOpts,
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
import { ProviderSubscriber } from "../events";
import { AllureTracker } from "./allure-tracker";
import { AllureStepper } from "./allure-stepper";
import { ScenarioMeta } from "./scenario-meta";

export class AllureSubscriber extends ProviderSubscriber {
  #tracker: AllureTracker;
  readonly meta: ScenarioMeta = {};

  constructor(private readonly opts: AllureConfig = { resultsDir: ".allure-reports" }) {
    super();
    this.#tracker = new AllureTracker(opts);
    this.tracker.startGroup("Base Group");
  }
  get fixtures() {
    return {
      instances: [{ token: AllureStepper, instance: this.#tracker.stepper }],
      prototypes: [],
    };
  }
  private get tracker() {
    return this.#tracker;
  }
  private get stepper() {
    return this.#tracker.stepper;
  }
  onFeatureStart = (opts: StartFeatureOpts) => {
    this.tracker.startGroup(`Feature: ${opts.title}`);
    this.meta.feature = `Feature: ${opts.title}`;
    this.meta.path = opts.path;
  };
  onFeatureEnd = (_opts: EndFeatureOpts) => {
    this.#tracker.endGroup();
    // this.tracker.end();
  };
  onRuleStart = (opts: StartRuleOpts) => {
    this.meta.suite = `Rule: ${opts.title}`;
    this.#tracker.startGroup(`Rule: ${opts.title}`);
  };
  onRuleEnd = (_opts: EndRuleOpts) => {
    this.meta.suite = undefined;
    this.#tracker.endGroup();
  };
  onScenarioOutlineStart = (opts: StartScenarioOutlineOpts) => {
    this.meta.subsuite = `Scenario Outline: ${opts.title}`;
    this.tracker.startGroup(`Scenario Outline: ${opts.title}`);
  };
  onScenarioOutlineEnd = (_opts: EndScenarioOpts) => {
    this.meta.subsuite = undefined;
    this.tracker.endGroup();
  };
  onScenarioStart = (opts: StartScenarioOpts) => {
    this.meta.example = opts.examples;
    this.tracker.startTest(`Scenario: ${opts.title}`, this.meta, opts);
  };
  onScenarioEnd = (opts: EndScenarioOpts) => {
    this.meta.example = undefined;
    this.tracker.end(opts);
  };
  onStepStart = (opts: StartStepOpts) => {
    this.tracker.startStep(`${opts.keyword} ${opts.text}`, opts);
  };
  onStepEnd = (opts: EndStepOpts) => {
    if (!opts.error) {
      this.tracker.currentStep.status = Status.PASSED;
    } else {
      this.tracker.currentStep.status = Status.FAILED;
    }
    this.tracker.endStep();
  };
  onPreScenarioStart = () => {
    this.#tracker.createTestGroup();
  };
  onPostScenarioEnd = () => {
    this.#tracker.endTestGroup();
  };
  onSetupStart = (opts: StartSetupOpts) => {
    this.tracker.startBefore(`Setup: ${opts.description}`);
  };
  onSetupEnd = (opts: EndSetupOpts) => {
    this.tracker.endBefore(opts);
    // this.tracker.endBefore();
    //   this.tracker.endStep();
  };
  onTeardownStart = (opts: StartTeardownOpts) => {
    this.tracker.startAfter(`Teardown: ${opts.description}`);
  };
  onTeardownEnd = (opts: EndTeardownOpts) => {
    this.tracker.endAfter(opts);
  };
  onBeforeStart = (opts: StartBeforeOpts) => {
    this.tracker.startBefore(`Before: ${opts.description}`);
  };
  onBeforeEnd = (opts: EndBeforeOpts) => {
    this.tracker.endBefore(opts);
  };
  onAfterStart = (opts: StartAfterOpts) => {
    this.tracker.startAfter(`After: ${opts.description}`);
  };
  onAfterEnd = (opts: EndAfterOpts) => {
    this.tracker.endAfter(opts);
  };
}
