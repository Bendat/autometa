import { FeatureScope } from "./feature-scope";
import { Scope } from "./scope";
import { StepCache } from "./caches/step-cache";
import { HookCache } from "./caches/hook-cache";
import { StepScope } from "./step-scope";
import { FeatureAction, RuleAction, ScenarioAction } from "./types";
import { Bind } from "@autometa/bind-decorator";
import { overloads, params, string, func } from "@autometa/overloaded";
import { Empty_Function } from "./novelties";
import { Execute, OnFeatureExecuted } from "./decorators";
import { ScenarioScope } from "./scenario-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { StepAction } from "@autometa/gherkin";
import { Scopes } from "./scopes";
import {
  CucumberExpression,
  ParameterTypeRegistry,
  RegularExpression,
} from "@cucumber/cucumber-expressions";
export class GlobalScope extends Scope implements Scopes {
  canHandleAsync = true;
  readonly stepCache: StepCache = new StepCache();
  canAttach<T extends Scope>(_childScope: T): boolean {
    return true;
  }
  
  get idString() {
    return "global";
  }

  parent: Scope;
  action: (...args: unknown[]) => void;

  constructor(
    readonly onFeatureExecuted: OnFeatureExecuted,
    readonly parameterRegistry: ParameterTypeRegistry
  ) {
    super(new HookCache());
  }
  get hookCache() {
    return this.openChild ? this.openChild.hooks ?? this.hooks : this.hooks;
  }
  @Bind
  override run() {
    // do nothing
  }
  override attach<T extends Scope>(childScope: T) {
    if (
      !this.openChild &&
      !(childScope instanceof FeatureScope) &&
      !(childScope instanceof StepScope)
    ) {
      throw new Error(
        `Only ${FeatureScope.name} and ${StepScope.name} can be executed globally. Scenarios, Outlines and Rules must exist inside a Feature`
      );
    }
    super.attach(childScope);
    return childScope;
  }
  private isBuilt = false;
  @Bind
  getStepCache() {
    if (this.isBuilt) {
      return this.stepCache;
    }
    this.closedScopes
      .filter((it) => it instanceof StepScope)
      .map((it) => it as unknown as StepScope)
      .forEach(this.stepCache.add);
    this.isBuilt = true;
    return this.stepCache;
  }

  Feature(filepath: string): FeatureScope;
  Feature(testDefinition: FeatureAction, filepath: string): FeatureScope;
  Feature(...args: (FeatureAction | string)[]): FeatureScope;
  @Execute
  Feature(...args: (FeatureAction | string)[]) {
    return overloads(
      params(func("featureAction"), string("filepath")).matches(
        (featureAction, filePath) => {
          const feature = new FeatureScope(filePath, featureAction, this.hooks);
          return this.attach(feature);
        }
      ),
      params(string("filePath")).matches((filePath) => {
        const feature = new FeatureScope(filePath, Empty_Function, this.hooks);
        return this.attach(feature);
      })
    ).use(args);
  }

  @Bind
  Scenario(title: string, action: ScenarioAction) {
    const scenario = new ScenarioScope(title, action, this.hooks);
    return this.attach(scenario);
  }

  @Bind
  ScenarioOutline(title: string, action: ScenarioAction) {
    const scenario = new ScenarioOutlineScope(title, action, this.hooks);
    return this.attach(scenario);
  }

  @Bind
  Rule(title: string, action: RuleAction) {
    const scenario = new RuleScope(title, action, this.hooks);
    return this.attach(scenario);
  }

  @Bind
  Given(title: string | RegExp, action: StepAction) {
    const expression = toExpression(title, this.parameterRegistry);
    const scenario = new StepScope("Given", "Context", expression, action);
    return this.attach(scenario);
  }

  @Bind
  When(title: string | RegExp, action: StepAction) {
    const expression = toExpression(title, this.parameterRegistry);
    const scenario = new StepScope("When", "Action", expression, action);
    return this.attach(scenario);
  }

  @Bind
  Then(title: string | RegExp, action: StepAction) {
    const expression = toExpression(title, this.parameterRegistry);
    const scenario = new StepScope("Then", "Outcome", expression, action);
    return this.attach(scenario);
  }
}

function toExpression(value: string | RegExp, registry: ParameterTypeRegistry) {
  return typeof value === "string"
    ? new CucumberExpression(value, registry)
    : new RegularExpression(value, registry);
}
