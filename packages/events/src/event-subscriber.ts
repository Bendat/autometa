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
  onFeatureStart?(opts: StartFeatureOpts): void;
  onFeatureEnd?(opts: EndFeatureOpts): void;
  onRuleStart?(opts: StartRuleOpts): void;
  onRuleEnd?(opts: EndRuleOpts): void;
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
