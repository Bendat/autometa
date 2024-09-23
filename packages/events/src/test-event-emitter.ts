import { EventSubscriber } from "./event-subscriber";
import { TestEmitter } from "./test-emitter";
import {
  StartScenarioOutlineOpts,
  EndScenarioOutlineOpts,
  StartFeatureOpts,
  EndFeatureOpts,
  StartRuleOpts,
  EndRuleOpts,
  StartScenarioOpts,
  EndScenarioOpts,
  StartSetupOpts,
  EndSetupOpts,
  StartTeardownOpts,
  EndTeardownOpts,
  StartBeforeOpts,
  EndBeforeOpts,
  StartAfterOpts,
  EndAfterOpts,
  StartStepOpts,
  EndStepOpts,
} from "./event-options";
export class TestEventEmitter {
  scenarioOutline = new TestEmitter<
    StartScenarioOutlineOpts,
    EndScenarioOutlineOpts
  >("ScenarioOutline");
  feature = new TestEmitter<StartFeatureOpts, EndFeatureOpts>("Feature");
  rule = new TestEmitter<StartRuleOpts, EndRuleOpts>("Rule");
  scenario = new TestEmitter<StartScenarioOpts, EndScenarioOpts>("Scenario");
  scenarioWrapper = new TestEmitter<never, never>("Scenario Wrapper");
  setup = new TestEmitter<StartSetupOpts, EndSetupOpts>("Setup");
  beforeFeature = new TestEmitter<StartSetupOpts, EndSetupOpts>(
    "BeforeFeature"
  );
  afterFeature = new TestEmitter<StartSetupOpts, EndSetupOpts>("AfterFeature");
  beforeRule = new TestEmitter<StartSetupOpts, EndSetupOpts>("BeforeRule");
  afterRule = new TestEmitter<StartSetupOpts, EndSetupOpts>("AfterRule");
  beforeScenarioOutline = new TestEmitter<StartSetupOpts, EndSetupOpts>(
    "BeforeScenarioOutline"
  );
  afterScenarioOutline = new TestEmitter<StartSetupOpts, EndSetupOpts>(
    "AfterScenarioOutline"
  );
  beforeExamples = new TestEmitter<StartSetupOpts, EndSetupOpts>(
    "BeforeExamples"
  );
  afterExamples = new TestEmitter<StartSetupOpts, EndSetupOpts>(
    "AfterExamples"
  );
  teardown = new TestEmitter<StartTeardownOpts, EndTeardownOpts>("Teardown");
  before = new TestEmitter<StartBeforeOpts, EndBeforeOpts>("Before");
  after = new TestEmitter<StartAfterOpts, EndAfterOpts>("After");
  step = new TestEmitter<StartStepOpts, EndStepOpts>("Step");
  beforeStep = new TestEmitter<StartStepOpts, EndStepOpts>("BeforeStep");
  afterStep = new TestEmitter<StartStepOpts, EndStepOpts>("AfterStep");

  settleAsyncEvents = async () => {
    return await Promise.allSettled([
      this.scenarioOutline.waitForPromises(),
      this.feature.waitForPromises(),
      this.rule.waitForPromises(),
      this.scenario.waitForPromises(),
      this.scenarioWrapper.waitForPromises(),
      this.setup.waitForPromises(),
      this.teardown.waitForPromises(),
      this.before.waitForPromises(),
      this.after.waitForPromises(),
      this.step.waitForPromises(),
    ]);
  };

  load = ({
    onFeatureStart,
    onFeatureEnd,
    onScenarioOutlineStart,
    onScenarioOutlineEnd,
    onScenarioStart,
    onScenarioEnd,
    onRuleStart,
    onRuleEnd,
    onBeforeStart,
    onBeforeEnd,
    onSetupStart,
    onSetupEnd,
    onStepStart,
    onStepEnd,
    onAfterStart,
    onAfterEnd,
    onTeardownStart,
    onTeardownEnd,
    onPreScenarioStart,
    onPostScenarioEnd,
    onBeforeFeatureStart,
    onBeforeFeatureEnd,
    onAfterFeatureStart,
    onAfterFeatureEnd,
    onBeforeRuleStart,
    onBeforeRuleEnd,
    onAfterRuleStart,
    onAfterRuleEnd,
    onBeforeScenarioOutlineStart,
    onBeforeScenarioOutlineEnd,
    onAfterScenarioOutlineStart,
    onAfterScenarioOutlineEnd,
    onBeforeExamplesStart,
    onBeforeExamplesEnd,
    onAfterExamplesStart,
    onBeforeStepStart,
    onBeforeStepEnd,
    onAfterStepStart,
    onAfterStepEnd,
  }: EventSubscriber) => {
    this.feature.load(onFeatureStart, onFeatureEnd);
    this.rule.load(onRuleStart, onRuleEnd);
    this.scenarioOutline.load(onScenarioOutlineStart, onScenarioOutlineEnd);
    this.scenario.load(onScenarioStart, onScenarioEnd);
    this.step.load(onStepStart, onStepEnd);
    this.before.load(onBeforeStart, onBeforeEnd);
    this.after.load(onAfterStart, onAfterEnd);
    this.setup.load(onSetupStart, onSetupEnd);
    this.teardown.load(onTeardownStart, onTeardownEnd);
    this.scenarioWrapper.load(onPreScenarioStart, onPostScenarioEnd);
    this.beforeFeature.load(onBeforeFeatureStart, onBeforeFeatureEnd);
    this.afterFeature.load(onAfterFeatureStart, onAfterFeatureEnd);
    this.beforeRule.load(onBeforeRuleStart, onBeforeRuleEnd);
    this.afterRule.load(onAfterRuleStart, onAfterRuleEnd);
    this.beforeScenarioOutline.load(
      onBeforeScenarioOutlineStart,
      onBeforeScenarioOutlineEnd
    );
    this.afterScenarioOutline.load(
      onAfterScenarioOutlineStart,
      onAfterScenarioOutlineEnd
    );
    this.beforeExamples.load(onBeforeExamplesStart, onBeforeExamplesEnd);
    this.afterExamples.load(onAfterExamplesStart, onBeforeStepStart);
    this.beforeStep.load(onBeforeStepStart, onBeforeStepEnd);
    this.afterStep.load(onAfterStepStart, onAfterStepEnd);
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Cb = (...args: any[]) => void;
