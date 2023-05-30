import { FeatureScope } from "./feature-scope";
import { Scope } from "./scope";
import { StepCache } from "./caches/step-cache";
import { HookCache } from "./caches/hook-cache";
import { StepScope } from "./step-scope";
import { FeatureAction, RuleAction, ScenarioAction } from "./types";
import { Bind } from "@autometa/bind-decorator";
import { overloads, def, string, func } from "@autometa/overloaded";
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
import { AfterHook, BeforeHook, SetupHook, TeardownHook } from "./hook";
export class GlobalScope extends Scope implements Scopes {
  canHandleAsync = false;
  readonly stepCache: StepCache = new StepCache();
  private isBuilt = false;

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
  get idString() {
    return "global";
  }

  canAttach<T extends Scope>(_childScope: T): boolean {
    return true;
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

  @Bind
  getStepCache() {
    if (this.isBuilt) {
      return this.stepCache;
    }
    this.closedScopes
      .filter((it) => it instanceof StepScope)
      .map((it) => it as StepScope)
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
      def`makeFeatureWithAction`(
        `An actionable feature has locally defined steps, 
        hooks, or scenarios which override globally defined ones`,
        func("featureAction"),
        string("filepath")
      ).matches((featureAction, filePath) => {
        const feature = new FeatureScope(filePath, featureAction, this.hooks);
        return this.attach(feature);
      }),
      def`makeGlobalStepFeature`(
        "makes a Feature scope which only executed globally defined steps.",
        string("filePath")
      ).matches((filePath) => {
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

  @Bind
  After(description: string, action: StepAction, tagFilterExpression?: string) {
    const hook = new AfterHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }
  
  @Bind
  Before(
    description: string,
    action: StepAction,
    tagFilterExpression?: string
  ) {
    const hook = new BeforeHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }

  @Bind
  Setup(description: string, action: StepAction, tagFilterExpression?: string) {
    const hook = new SetupHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }

  @Bind
  Teardown(
    description: string,
    action: StepAction,
    tagFilterExpression?: string
  ) {
    const hook = new TeardownHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }
}

function toExpression(value: string | RegExp, registry: ParameterTypeRegistry) {
  return typeof value === "string"
    ? new CucumberExpression(value, registry)
    : new RegularExpression(value, registry);
}
