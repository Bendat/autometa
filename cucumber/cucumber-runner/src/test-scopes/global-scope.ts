import { HookCache, StepCache } from "../gherkin/step-cache";
import { FeatureScope } from "./feature-scope";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";

export class GlobalScope extends Scope {
  synchronous = true;
  readonly stepCache: StepCache = new StepCache();
  hooks = new HookCache();
  canAttach<T extends Scope>(_childScope: T): boolean {
    return true;
  }
  idString = () => "global";
  parent: Scope;
  action: (...args: unknown[]) => void;
  get hookCache(){
    return this.openChild ? this.openChild.hooks ?? this.hooks : this.hooks;
  }
  override run = () => {
    // do nothing
  };
  override attach<T extends Scope>(childScope: T): void {
    if (!this.openChild && !(childScope instanceof FeatureScope) && !(childScope instanceof StepScope)) {
      throw new Error(
        `Only ${FeatureScope.name} and ${StepScope.name} can be executed globally. Scenarios, Outlines and Rules must exist inside a Feature}`
      );
    }
    super.attach(childScope);
  }
  private isBuilt = false;
  getStepCache = () => {
    if (this.isBuilt) {
      return this.stepCache;
    }
    this.closedScopes.forEach((scope) => {
      if (scope instanceof StepScope) {
        const { keywordType, keyword, text, action, tableType } = scope;
        this.stepCache.add(keywordType, keyword, text, action, tableType);
      }
    });
    this.isBuilt = true;
    return this.stepCache;

  };
}
