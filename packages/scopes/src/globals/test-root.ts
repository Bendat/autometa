import { FeatureAction } from "@autometa/gherkin";
import bind from "autobind-decorator";
import { AutomationError } from "src/automation-error";
import { GlobalScope } from "src/global-scope";
import { HookCache } from "src/caches/hook-cache";

export class TestRootSkip {
  @bind
  Feature() {}
  @bind
  Rule() {}
  @bind
  Scenario() {}
  @bind
  ScenarioOutline() {}
  @bind
  Given() {}
  @bind
  When() {}
  @bind
  Then() {}
}

function isGherkinOnlyFeature() {}
export class TestRootOnly {
  Feature(action: FeatureAction): void;
  Feature(action: FeatureAction, path: string): void;
  @bind
  Feature(...args: (FeatureAction | string)[]): void {}
  @bind
  Rule() {}
  @bind
  Scenario() {}
  @bind
  ScenarioOutline() {}
  @bind
  Given() {}
  @bind
  When() {}
  @bind
  Then() {}
}
export class TestRoot {
  readonly root = new GlobalScope(new HookCache());
  Feature(action: FeatureAction): void;
  Feature(action: FeatureAction, path: string): void;
  @bind
  Feature(...args: (FeatureAction | string)[]): void {}
  @bind
  Rule() {}
  @bind
  Scenario() {}
  @bind
  ScenarioOutline() {}
  @bind
  Given() {}
  @bind
  When() {}
  @bind
  Then() {}
}

abstract class FeatureArguments {
  static parseArgs(...args: (FeatureAction | string)[]) {
    if (args.length === 0) {
      throw new AutomationError(
        `Feature must have either a test callback, a path to a feature file(s), or both. No arguments provided`
      );
    }
    if (args.length == 1) {
      const [arg] = args;
      if (typeof arg === "function") {
        return new ImplementationOnlyArgs(arg);
      }
      if (typeof arg === "string") {
        return new FileOnlyArgs([arg]);
      }
    }
    if (allStrings(args)) {
      return new FileOnlyArgs(args as string[]);
    }
  }
}
class GherkinAndImplementationArg extends FeatureArguments {
  constructor(readonly action: FeatureAction, readonly filePaths: string[]) {
    super();
  }
}

class FileOnlyArgs extends FeatureArguments {
  constructor(readonly filePaths: string[]) {
    super();
  }
}

class ImplementationOnlyArgs extends FeatureArguments {
  constructor(readonly action: FeatureAction) {
    super();
  }
}

function allStrings(args: unknown[]): args is string[] {
  return args.every((it) => typeof it === "string");
}
