import { Background } from "@autometa/gherkin";
import { HookCache, StepCache } from "./caches";
import { Scope } from "./scope";
import { BackgroundAction } from "./types";

export class BackgroundScope extends Scope {
  constructor(
    public readonly name: string | undefined,
    public readonly action: BackgroundAction,
    parentHooksCache: HookCache,
    parentStepCache: StepCache
  ) {
    super(parentHooksCache, parentStepCache);
  }
  get idString(): string {
    return this.name ?? "";
  }
  title(gherkin: Background) {
    return `${gherkin.keyword} ${gherkin.name}`;
  }
}
