import {
  StartFeatureOpts,
  EndFeatureOpts,
  StartRuleOpts,
  EndRuleOpts,
  StartScenarioOutlineOpts,
  EndScenarioOpts,
  StartScenarioOpts,
  StartStepOpts,
  EndStepOpts,
  StartSetupOpts,
  EndSetupOpts,
  StartTeardownOpts,
  EndTeardownOpts,
  StartBeforeOpts,
  EndBeforeOpts,
  StartAfterOpts,
  EndAfterOpts,
} from "./event-options";
import { Bind } from "@autometa/bind-decorator";
import { EventSubscriber } from "./event-subscriber";

export class EventDispatcher implements EventSubscriber {
  constructor(readonly events: EventSubscriber[]) {}
  
  @Bind
  addEvent(event: EventSubscriber) {
    this.events.push(event);
  }

  @Bind
  onFeatureStart(opts: StartFeatureOpts) {
    this.events.forEach((event) => event.onFeatureStart?.(opts));
  }

  @Bind
  onFeatureEnd(opts: EndFeatureOpts): void {
    this.events.forEach((event) => event.onFeatureEnd?.(opts));
  }

  @Bind
  onRuleStart(opts: StartRuleOpts): void {
    this.events.forEach((event) => event.onRuleStart?.(opts));
  }

  @Bind
  onRuleEnd(opts: EndRuleOpts): void {
    this.events.forEach((event) => event.onRuleEnd?.(opts));
  }

  @Bind
  onScenarioOutlineStart(opts: StartScenarioOutlineOpts): void {
    this.events.forEach((event) => event.onScenarioOutlineStart?.(opts));
  }

  @Bind
  onScenarioOutlineEnd(opts: EndScenarioOpts): void {
    this.events.forEach((event) => event.onScenarioOutlineEnd?.(opts));
  }

  @Bind
  onPreScenarioStart(): void {
    this.events.forEach((event) => event.onPreScenarioStart?.());
  }

  @Bind
  onPostScenarioEnd(): void {
    this.events.forEach((event) => event.onPostScenarioEnd?.());
  }

  @Bind
  onScenarioStart(opts: StartScenarioOpts): void {
    this.events.forEach((event) => event.onScenarioStart?.(opts));
  }

  @Bind
  onScenarioEnd(opts: EndScenarioOpts): void {
    this.events.forEach((event) => event.onScenarioEnd?.(opts));
  }

  @Bind
  onStepStart(opts: StartStepOpts): void {
    this.events.forEach((event) => event.onStepStart?.(opts));
  }

  @Bind
  onStepEnd(opts: EndStepOpts): void {
    this.events.forEach((event) => event.onStepEnd?.(opts));
  }

  @Bind
  onSetupStart(opts: StartSetupOpts): void {
    this.events.forEach((event) => event.onSetupStart?.(opts));
  }

  @Bind
  onSetupEnd(opts: EndSetupOpts): void {
    this.events.forEach((event) => event.onSetupEnd?.(opts));
  }

  @Bind
  onTeardownStart(opts: StartTeardownOpts): void {
    this.events.forEach((event) => event.onTeardownStart?.(opts));
  }

  @Bind
  onTeardownEnd(opts: EndTeardownOpts): void {
    this.events.forEach((event) => event.onTeardownEnd?.(opts));
  }

  @Bind
  onBeforeStart(opts: StartBeforeOpts): void {
    this.events.forEach((event) => event.onBeforeStart?.(opts));
  }

  @Bind
  onBeforeEnd(opts: EndBeforeOpts): void {
    this.events.forEach((event) => event.onBeforeEnd?.(opts));
  }

  @Bind
  onAfterStart(opts: StartAfterOpts): void {
    this.events.forEach((event) => event.onAfterStart?.(opts));
  }

  @Bind
  onAfterEnd(opts: EndAfterOpts): void {
    this.events.forEach((event) => event.onAfterEnd?.(opts));
  }
}
