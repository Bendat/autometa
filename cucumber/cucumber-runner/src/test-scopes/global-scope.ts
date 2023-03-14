import { HookCache, StepCache } from "@gherkin/step-cache";
import { TestFunctions } from "@gherkin/test-functions";
import { FeatureScope } from "./feature-scope";
import { executeHooks } from "./hooks";
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
        const { keywordType, keyword, text, action } = scope;
        this.stepCache.add(keywordType, keyword, text, action);
      }
    });
    this.isBuilt = true;
    return this.stepCache;
  };

  runHooks = (testFunctions: TestFunctions, app: () => unknown) => {
    testFunctions.beforeAll(async (...args: unknown[]) => {
      await executeHooks(this.hooks.setup, ...args);
    });
    testFunctions.beforeEach(async (...args: unknown[]) => {
      await executeHooks(this.hooks.before, app(), ...args);
    });

    testFunctions.afterEach(async (...args: unknown[]) => {
      await executeHooks(this.hooks.after, app(), ...args);
    });
    testFunctions.afterAll(async (...args: unknown[]) => {
      await executeHooks(this.hooks.setup, ...args);
    });
  };
}
