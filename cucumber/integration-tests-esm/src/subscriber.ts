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
} from "@autometa/cucumber-runner";

export class Subscriber implements EventSubscriber {
  onFeatureStart?(opts: StartFeatureOpts) {
    console.log(`Feature started ${JSON.stringify(opts)}`);
  }
  onFeatureEnd?(opts: EndFeatureOpts): void {
    console.log(`Feature ended ${JSON.stringify(opts)}`);
  }
  onRuleStart?(opts: StartRuleOpts): void {
    console.log(`Rule started ${JSON.stringify(opts)}`);
  }
  onRuleEnd?(opts: EndRuleOpts): void {
    console.log(`Rule ended ${JSON.stringify(opts)}`);
  }
  onScenarioOutlineStart?(opts: StartScenarioOutlineOpts): void {
    console.log(`Scenario Outline started ${JSON.stringify(opts)}`);
  }
  onScenarioOutlineEnd?(opts: EndScenarioOpts): void {
    console.log(`Scenario Outline ended ${JSON.stringify(opts)}`);
  }
  onScenarioStart?(opts: StartScenarioOpts): void {
    console.log(`Scenarioture started ${JSON.stringify(opts)}`);
  }
  onScenarioEnd?(opts: EndScenarioOpts): void {
    console.log(`Scenario ended${JSON.stringify(opts)}`);
  }
  onStepStart?(opts: StartStepOpts): void {
    console.log(`Step started ${JSON.stringify(opts)}`);
  }
  onStepEnd?(opts: EndStepOpts): void {
    console.log(`Step ended ${JSON.stringify(opts)}`);
  }
  onSetupStart?(opts: StartSetupOpts): void {
    console.log(`Setup started ${JSON.stringify(opts)}`);
  }
  onSetupEnd?(opts: EndSetupOpts): void {
    console.log(`Setup Ended ${JSON.stringify(opts)}`);
  }
  onTeardownStart?(opts: StartTeardownOpts): void {
    console.log(`Teardown started ${JSON.stringify(opts)}`);
  }
  onTeardownEnd?(opts: EndTeardownOpts): void {
    console.log(`Teardown ended ${JSON.stringify(opts)}`);
  }
  onBeforeStart?(opts: StartBeforeOpts): void {
    console.log(`before started ${JSON.stringify(opts)}`);
  }
  onBeforeEnd?(opts: EndBeforeOpts): void {
    console.log(`Before ended ${JSON.stringify(opts)}`);
  }
  onAfterStart?(opts: StartAfterOpts): void {
    console.log(`After started ${JSON.stringify(opts)}`);
  }
  onAfterEnd?(opts: EndAfterOpts): void {
    console.log(`After ended ${JSON.stringify(opts)}`);
  }
}
