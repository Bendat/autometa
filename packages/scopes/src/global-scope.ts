import { FeatureScope } from "./feature-scope";
import { Scope } from "./scope";
import { StepCache } from "./caches/step-cache";
import { HookCache } from "./caches/hook-cache";
import { StepScope } from "./step-scope";
import { Bind } from "@autometa/bind-decorator";
import { overloads, def, string, func, fallback } from "@autometa/overloaded";
import { Empty_Function } from "./novelties";
import { OnFeatureExecuted } from "./decorators";
import { ScenarioScope } from "./scenario-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { Scopes } from "./scopes";
import {
  CucumberExpression,
  ParameterTypeRegistry,
  RegularExpression,
} from "@cucumber/cucumber-expressions";
import { AfterHook, BeforeHook, SetupHook, TeardownHook } from "./hook";
import type{ FeatureAction, RuleAction, ScenarioAction, HookAction, StepAction } from "./types";
import { AutomationError } from "@autometa/errors";
import { GherkinNode } from "@autometa/gherkin";
import { DataTable } from "@autometa/gherkin";
import { Class } from "@autometa/types";
export class GlobalScope extends Scope implements Scopes {
  canHandleAsync = false;
  private _onFeatureExecuted: OnFeatureExecuted;

  // readonly stepCache: StepCache = new StepCache();
  action: (...args: unknown[]) => void;

  constructor(readonly parameterRegistry: ParameterTypeRegistry) {
    super(new HookCache(), new StepCache());
  }
  set onFeatureExecuted(value: OnFeatureExecuted) {
    this._onFeatureExecuted = value;
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

  Feature(filepath: string): FeatureScope;
  Feature(testDefinition: FeatureAction, filepath: string): FeatureScope;
  Feature(...args: (FeatureAction | string)[]): FeatureScope;
  @Bind
  Feature(...args: (FeatureAction | string)[]) {
    return overloads(
      def`makeScopedFeature`(func("featureAction"), string("filepath")).matches(
        (featureAction, filePath) => {
          const feature = new FeatureScope(
            filePath,
            featureAction,
            this.hookCache,
            this.stepCache
          );
          this.attach(feature);
          this._onFeatureExecuted(feature);
          return feature;
        }
      ),
      def`makeGherkinOnlyStepFeature`(
        "makes a Feature scope which only executed globally defined steps.",
        string("filePath")
      ).matches((filePath) => {
        const feature = new FeatureScope(
          filePath,
          Empty_Function,
          this.hookCache,
          this.stepCache
        );
        this.attach(feature);
        this._onFeatureExecuted(feature);
        return feature;
      }),
      fallback((...args) => {
        throw new AutomationError(`Invalid arguments for Feature.

You can either define a 'gherkin' only feature by passing only a string filepath. This
will only execute steps defined globally.

Feature('path/to/feature.feature')

Or a 'scoped' feature by passing a function and a string filepath. The function
may contain test specific steps

Feature((feature) => {
  Step('outer step', ()=>{
    // ...
  })
  Scenario('special scenario', ()=>{
    Step('inner step', ()=>{
      // ...
    })
  })
}, 'path/to/feature.feature')

The arguments provided are not acceptable:
[${args.map((it) => typeof it).join(", ")}]
${JSON.stringify(args, null, 2)}`);
      })
    ).use(args);
  }

  onStart(_gherkin: GherkinNode) {
    throw new AutomationError(`GlobalScope.onStart is not implemented`);
  }

  onEnd(_error?: Error) {
    throw new AutomationError(`GlobalScope.onEnd is not implemented`);
  }

  @Bind
  Scenario(title: string, action: ScenarioAction) {
    const scenario = new ScenarioScope(
      title,
      action,
      this.hookCache,
      this.stepCache
    );
    return this.attach(scenario);
  }

  @Bind
  ScenarioOutline(title: string, action: ScenarioAction) {
    const scenario = new ScenarioOutlineScope(
      title,
      action,
      this.hookCache,
      this.stepCache
    );
    return this.attach(scenario);
  }

  @Bind
  Rule(title: string, action: RuleAction) {
    const scenario = new RuleScope(
      title,
      action,
      this.hookCache,
      this.stepCache
    );
    return this.attach(scenario);
  }

  @Bind
  Given<TText extends string, TTable extends DataTable>(
    title: TText,
    action: StepAction<TText, TTable>,
    tableType?: Class<TTable>
  ) {
    const expression = toExpression(title, this.parameterRegistry);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = action as any;
    const scenario = new StepScope(
      "Given",
      "Context",
      expression,
      fn,
      tableType
    );
    this.attach(scenario);
  }

  @Bind
  When<TText extends string, TTable extends DataTable>(
    title: TText,
    action: StepAction<TText, TTable>,
    tableType?: Class<TTable>
  ) {
    const expression = toExpression(title, this.parameterRegistry);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = action as any;
    const scenario = new StepScope("When", "Action", expression, fn, tableType);
    this.attach(scenario);
  }

  @Bind
  Then<TText extends string, TTable extends DataTable>(
    title: TText,
    action: StepAction<TText, TTable>,
    tableType?: Class<TTable>
  ) {
    const expression = toExpression(title, this.parameterRegistry);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = action as any;
    const scenario = new StepScope(
      "Then",
      "Outcome",
      expression,
      fn,
      tableType
    );
    this.attach(scenario);
  }

  @Bind
  After(description: string, action: HookAction, tagFilterExpression?: string) {
    const hook = new AfterHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }

  @Bind
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression?: string
  ) {
    const hook = new BeforeHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }

  @Bind
  Setup(description: string, action: HookAction, tagFilterExpression?: string) {
    const hook = new SetupHook(description, action, tagFilterExpression);
    return this.attachHook(hook);
  }

  @Bind
  Teardown(
    description: string,
    action: HookAction,
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
