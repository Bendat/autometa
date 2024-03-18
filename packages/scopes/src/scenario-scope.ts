import type { ScenarioAction, TimedScope } from "./types";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
import { HookCache } from "./caches/hook-cache";
import { StepCache } from "./caches";
import {
  Example,
  Examples,
  Scenario,
  ScenarioOutline,
} from "@autometa/gherkin";
import { AutomationError } from "@autometa/errors";
import { Timeout } from "./timeout";

export class ScenarioScope extends Scope implements TimedScope {
  canHandleAsync = false;
  constructor(
    public readonly name: string,
    public readonly action: ScenarioAction,
    public readonly timeout: Timeout | undefined,
    parentHooksCache: HookCache,
    parentStepCache: StepCache
  ) {
    super(parentHooksCache, parentStepCache);
  }
  protected get canAttachHook(): boolean {
    return false;
  }

  get idString() {
    return this.name;
  }
  title(gherkin: Scenario | ScenarioOutline | Examples | Example) {
    return `${gherkin.keyword}: ${this.name}`;
  }
  canAttach<T extends Scope>(childScope: T): boolean {
    return childScope instanceof StepScope;
  }

  attach<T extends Scope>(childScope: T): void {
    if (!this.canAttach(childScope)) {
      throw new AutomationError(
        `A Scenario can only execute a a 'Step', such as 'Given', 'When' or 'Then`
      );
    }
    super.attach(childScope);
  }
}
