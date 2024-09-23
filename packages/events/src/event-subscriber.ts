import { Class } from "@autometa/types";
import { InjectionToken } from "tsyringe";
import {
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
} from "./event-options";
import { object, function as fun } from "zod";
export type DependencyInstanceProvider = {
  token: InjectionToken<unknown>;
  instance: unknown;
};

export const EventSubscriberSchema = object({
  onFeature: fun(),
});
export interface EventSubscriber {
  onBeforeFeatureStart?(opts: StartFeatureOpts): void;
  onBeforeFeatureEnd?(opts: EndFeatureOpts): void;
  onAfterFeatureStart?(opts: StartFeatureOpts): void;
  onAfterFeatureEnd?(opts: EndFeatureOpts): void;
  onFeatureStart?(opts: StartFeatureOpts): void;
  onFeatureEnd?(opts: EndFeatureOpts): void;
  onBeforeRuleStart?(opts: StartRuleOpts): void;
  onBeforeRuleEnd?(opts: EndRuleOpts): void;
  onAfterRuleStart?(opts: StartRuleOpts): void;
  onAfterRuleEnd?(opts: EndRuleOpts): void;
  onRuleStart?(opts: StartRuleOpts): void;
  onRuleEnd?(opts: EndRuleOpts): void;
  onBeforeScenarioOutlineStart?(opts: StartScenarioOutlineOpts): void;
  onBeforeScenarioOutlineEnd?(opts: EndScenarioOpts): void;
  onAfterScenarioOutlineStart?(opts: StartScenarioOutlineOpts): void;
  onAfterScenarioOutlineEnd?(opts: EndScenarioOpts): void;
  onBeforeExamplesStart?(opts: StartScenarioOutlineOpts): void;
  onBeforeExamplesEnd?(opts: EndScenarioOpts): void;
  onAfterExamplesStart?(opts: StartScenarioOutlineOpts): void;
  onAfterExamplesEnd?(opts: EndScenarioOpts): void;
  onScenarioOutlineStart?(opts: StartScenarioOutlineOpts): void;
  onScenarioOutlineEnd?(opts: EndScenarioOpts): void;
  onPreScenarioStart?(): void;
  onPostScenarioEnd?(): void;
  onScenarioStart?(opts: StartScenarioOpts): void;
  onScenarioEnd?(opts: EndScenarioOpts): void;
  onStepStart?(opts: StartStepOpts): void;
  onStepEnd?(opts: EndStepOpts): void;
  onSetupStart?(opts: StartSetupOpts): void;
  onSetupEnd?(opts: EndSetupOpts): void;
  onTeardownStart?(opts: StartTeardownOpts): void;
  onTeardownEnd?(opts: EndTeardownOpts): void;
  onBeforeStart?(opts: StartBeforeOpts): void;
  onBeforeEnd?(opts: EndBeforeOpts): void;
  onAfterStart?(opts: StartAfterOpts): void;
  onAfterEnd?(opts: EndAfterOpts): void;
  onBeforeStepStart?(opts: StartStepOpts): void;
  onBeforeStepEnd?(opts: EndStepOpts): void;
  onAfterStepStart?(opts: StartStepOpts): void;
  onAfterStepEnd?(opts: EndStepOpts): void;
}

export abstract class ProviderSubscriber implements EventSubscriber {
  abstract get fixtures(): {
    instances?: DependencyInstanceProvider[];
    prototypes?: Class<unknown>[];
  };

  addFixtureInstance = (instance: DependencyInstanceProvider) => {
    this.fixtures.instances?.push(instance);
  };

  onFeatureStart?(opts: StartFeatureOpts): void;
}
