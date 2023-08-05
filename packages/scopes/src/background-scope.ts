import { HookCache, StepCache } from "./caches";
import { Scope } from "./scope";
import { BackgroundAction } from "./types";

export class BackgroundScope extends Scope {
  constructor(
    public readonly name: string | undefined,
    public readonly action: BackgroundAction,
    parentHooksCache: HookCache,
    parentStepCache: StepCache,
    buildStepCache: () => unknown
  ) {
    super(parentHooksCache, parentStepCache, buildStepCache);
  }
  get idString(): string {
    return this.name ?? "";
  }
}
