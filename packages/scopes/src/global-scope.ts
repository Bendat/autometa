import { FeatureScope } from "./feature-scope";
import { Scope } from "./scope";
import { StepCache } from "./caches/step-cache";
import { HookCache } from "./caches/hook-cache";
import { StepScope } from "./step-scope";
import { Bind } from "@autometa/bind-decorator";
import {
  overloads,
  def,
  string,
  func,
  fallback,
  number,
  tuple,
} from "@autometa/overloaded";
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
import {
  AfterExamplesHook,
  AfterFeatureHook,
  AfterHook,
  AfterRuleHook,
  AfterScenarioOutlineHook,
  BeforeExamplesHook,
  BeforeFeatureHook,
  BeforeHook,
  BeforeRuleHook,
  BeforeScenarioOutlineHook,
  Hook,
  SetupHook,
  TaggedHook,
  TeardownHook,
} from "./hook";
import type {
  FeatureAction,
  RuleAction,
  ScenarioAction,
  HookAction,
  StepActionFn,
  TestTimeout,
  SizedTimeout,
  AfterGroupHookAction,
} from "./types";
import { AutomationError } from "@autometa/errors";
import { DataTable, TableDocument } from "@autometa/gherkin";
import { Class } from "@autometa/types";
import getCaller from "get-caller-file";
import path from "path";
import { Timeout, assertTimeout } from "./timeout";
export class GlobalScope extends Scope implements Omit<Scopes, "Global"> {
  canHandleAsync = false;
  timeout = undefined;
  private _onFeatureExecuted: OnFeatureExecuted;

  action: (...args: unknown[]) => void;

  lock() {
    this.isOpen = false;
  }
  unlock() {
    this.isOpen = true;
  }

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
      throw new AutomationError(
        `Only ${FeatureScope.name} and ${StepScope.name} can be executed globally. Scenarios, Outlines and Rules must exist inside a Feature`
      );
    }
    super.attach(childScope);
    return childScope;
  }

  Feature(filepath: string): FeatureScope;
  Feature(filepath: string, timeout: number): FeatureScope;
  Feature(filepath: string, timeout: SizedTimeout): FeatureScope;
  Feature(featureAction: FeatureAction, filepath: string): FeatureScope;
  Feature(
    featureAction: FeatureAction,
    filepath: string,
    timeout: number
  ): FeatureScope;
  Feature(
    featureAction: FeatureAction,
    filepath: string,
    timeout: SizedTimeout
  ): FeatureScope;
  @Bind
  Feature(...args: (FeatureAction | string | TestTimeout)[]) {
    const caller = path.dirname(getCaller(3));
    const feature: FeatureScope = overloads(
      def(string("filePath"), number("timeout")).matches(
        (filePath, timeout) => {
          return new FeatureScope(
            filePath,
            Empty_Function,
            Timeout.from(timeout),
            this.hookCache,
            this.steps
          );
        }
      ),
      def(
        string("filePath"),
        tuple([number("timeout"), string("unit")])
      ).matches((filePath, timeout) => {
        assertTimeout(timeout);
        return new FeatureScope(
          filePath,
          Empty_Function,
          Timeout.from(timeout),
          this.hookCache,
          this.steps
        );
      }),

      def(func("featureAction"), string("filePath"), number("timeout")).matches(
        (featureAction, filePath, timeout) => {
          return new FeatureScope(
            filePath,
            featureAction,
            Timeout.from(timeout),
            this.hookCache,
            this.steps
          );
        }
      ),
      def(
        func("featureAction"),
        string("filePath"),
        tuple([number("timeout"), string("unit")])
      ).matches((featureAction, filePath, timeout) => {
        assertTimeout(timeout);
        return new FeatureScope(
          filePath,
          featureAction,
          Timeout.from(timeout),
          this.hookCache,
          this.steps
        );
      }),
      def(func("featureAction"), string("filepath")).matches(
        (featureAction, filePath) => {
          return new FeatureScope(
            filePath,
            featureAction,
            Timeout.from(0),
            this.hookCache,
            this.steps
          );
        }
      ),
      def(string("filePath")).matches((filePath) => {
        return new FeatureScope(
          filePath,
          Empty_Function,
          Timeout.from(0),
          this.hookCache,
          this.steps
        );
      }),
      fallback((...args) => {
        featureFallbackErrorMessage(args);
      })
    ).use(args) as FeatureScope;
    this.attach(feature);
    this._onFeatureExecuted(feature, caller);
    return feature;
  }

  Scenario(title: string, action: ScenarioAction): ScenarioScope;
  Scenario(
    title: string,
    action: ScenarioAction,
    timeout: number
  ): ScenarioScope;
  Scenario(
    title: string,
    action: ScenarioAction,
    timeout: TestTimeout
  ): ScenarioScope;
  @Bind
  Scenario(title: string, action: ScenarioAction, timeout?: TestTimeout) {
    const args = this.scenarioArgs(title, action, timeout);
    const scenario = new ScenarioScope(...args);
    return this.attach(scenario);
  }

  ScenarioOutline(title: string, action: ScenarioAction): ScenarioOutlineScope;
  ScenarioOutline(
    title: string,
    action: ScenarioAction,
    timeout: number
  ): ScenarioScope;
  ScenarioOutline(
    title: string,
    action: ScenarioAction,
    timeout: SizedTimeout
  ): ScenarioScope;
  @Bind
  ScenarioOutline(
    title: string,
    action: ScenarioAction,
    timeout?: TestTimeout
  ) {
    const args = this.scenarioArgs(title, action, timeout);
    const scenario = new ScenarioOutlineScope(...args);
    return this.attach(scenario);
  }

  Rule(title: string, action: RuleAction): RuleScope;
  Rule(title: string, action: RuleAction, timeout: number): RuleScope;
  Rule(title: string, action: RuleAction, timeout: SizedTimeout): RuleScope;
  @Bind
  Rule(title: string, action: RuleAction, timeout?: TestTimeout) {
    const { parentHookCache, parentStepCache } = this.ruleCaches();
    const args = overloads(
      def(string(), func<RuleAction>(), number()).matches(
        (title, action, timeout) => {
          return [title, action, Timeout.from(timeout)] as const;
        }
      ),
      def(string(), func<RuleAction>(), tuple([number(), string()])).matches(
        (title, action, timeout) => {
          assertTimeout(timeout);
          return [title, action, Timeout.from(timeout)] as const;
        }
      ),
      def(string(), func<RuleAction>()).matches((title, action) => {
        return [title, action, Timeout.from(0)] as const;
      })
    ).use([title, action, timeout]);
    const rule = new RuleScope(...args, parentHookCache, parentStepCache);
    return this.attach(rule);
  }

  @Bind
  Given<
    TText extends string,
    TTable extends DataTable | TableDocument<DataTable>
  >(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ) {
    const expression = toExpression(title, this.parameterRegistry);
    const step = new StepScope(
      "Given",
      "Context",
      expression,
      action,
      tableType
    );
    return this.attach(step);
  }

  @Bind
  When<
    TText extends string,
    TTable extends DataTable | TableDocument<DataTable>
  >(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ) {
    const expression = toExpression(title, this.parameterRegistry);
    const step = new StepScope("When", "Action", expression, action, tableType);
    return this.attach(step);
  }

  @Bind
  Then<
    TText extends string,
    TTable extends DataTable | TableDocument<DataTable>
  >(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ) {
    const expression = toExpression(title, this.parameterRegistry);
    const step = new StepScope(
      "Then",
      "Outcome",
      expression,
      action,
      tableType
    );
    return this.attach(step);
  }

  After(description: string, action: HookAction): AfterHook;
  After(description: string, action: HookAction, timeout: number): AfterHook;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): AfterHook;
  @Bind
  After(
    description: string,
    action: HookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ): AfterHook {
    return this.hook(AfterHook, description, action, exprOrTimeout, timeout);
  }

  Before(description: string, action: HookAction): BeforeHook;
  Before(description: string, action: HookAction, timeout: number): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): BeforeHook;
  @Bind
  Before(
    description: string,
    action: HookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ): BeforeHook {
    return this.hook(BeforeHook, description, action, exprOrTimeout, timeout);
  }

  Setup(description: string, action: HookAction): SetupHook;
  Setup(description: string, action: HookAction, timeout: number): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): SetupHook;
  @Bind
  Setup(
    description: string,
    action: HookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ) {
    return this.hook(SetupHook, description, action, exprOrTimeout, timeout);
  }

  Teardown(description: string, action: HookAction): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    timeout: number
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): TeardownHook;
  @Bind
  Teardown(
    description: string,
    action: HookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ) {
    return this.hook(TeardownHook, description, action, exprOrTimeout, timeout);
  }

  @Bind
  BeforeFeature(description: string, action: HookAction): BeforeFeatureHook {
    return this.hook(BeforeFeatureHook, description, action);
  }

  @Bind
  AfterFeature(
    description: string,
    action: AfterGroupHookAction
  ): AfterFeatureHook {
    return this.hook(AfterFeatureHook, description, action);
  }

  @Bind
  BeforeScenarioOutline(
    description: string,
    action: HookAction
  ): BeforeScenarioOutlineHook {
    return this.hook(BeforeScenarioOutlineHook, description, action);
  }

  @Bind
  AfterScenarioOutline(
    description: string,
    action: AfterGroupHookAction
  ): AfterScenarioOutlineHook {
    return this.hook(AfterScenarioOutlineHook, description, action);
  }

  @Bind
  BeforeExamples(description: string, action: HookAction) {
    return this.hook(BeforeExamplesHook, description, action);
  }

  @Bind
  AfterExamples(description: string, action: AfterGroupHookAction) {
    return this.hook(AfterExamplesHook, description, action);
  }

  @Bind
  BeforeRule(description: string, action: HookAction) {
    return this.hook(BeforeRuleHook, description, action);
  }

  @Bind
  AfterRule(description: string, action: AfterGroupHookAction) {
    return this.hook(AfterRuleHook, description, action);
  }

  private scenarioArgs(
    title: string,
    action: ScenarioAction,
    timeout: TestTimeout | undefined
  ) {
    const { parentHookCache, parentStepCache } = this.scenarioCaches();

    return overloads(
      def(
        string(),
        func<ScenarioAction>(),
        tuple([number(), string()])
      ).matches((title, action, timeout) => {
        assertTimeout(timeout);
        return [
          title,
          action,
          Timeout.from(timeout),
          parentHookCache,
          parentStepCache,
        ] as const;
      }),

      def(string(), func<ScenarioAction>(), number()).matches(
        (title, action, timeout) => {
          return [
            title,
            action,
            Timeout.from(timeout),
            parentHookCache,
            parentStepCache,
          ] as const;
        }
      ),

      def(string(), func<ScenarioAction>()).matches((title, action) => {
        return [
          title,
          action,
          Timeout.from(0),
          parentHookCache,
          parentStepCache,
        ] as const;
      })
    ).use([title, action, timeout]);
  }

  hook<T extends Hook | TaggedHook>(
    type: Class<T>,
    description: string,
    action: HookAction | AfterGroupHookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ) {
    const hook = new type(description, action) as TaggedHook;

    overloads(
      def(string(), tuple([number(), string()])).matches(
        (tagFilterExpression, timeout) => {
          assertTimeout(timeout);
          const testTimeout = Timeout.from(timeout);
          hook.tagFilter(tagFilterExpression).timeout(testTimeout);
        }
      ),
      def(tuple([number(), string()])).matches((timeout) => {
        assertTimeout(timeout);
        const testTimeout = Timeout.from(timeout);
        hook.timeout(testTimeout);
      }),
      def(string(), number()).matches((tagFilterExpression, timeout) => {
        const testTimeout = Timeout.from(timeout);
        hook.tagFilter(tagFilterExpression).timeout(testTimeout);
      }),
      def(string()).matches((tagFilterExpression) => {
        hook.tagFilter(tagFilterExpression);
      }),
      def(number()).matches((timeout) => {
        const testTimeout = Timeout.from(timeout);
        hook.timeout(testTimeout);
      }),
      def().matches(() => {
        // noop
      }),
      fallback((...args) => {
        throw new Error(`You weren't supposed to see this. args: ${args}`);
      })
    ).use([exprOrTimeout, timeout]);
    return this.attachHook(hook) as T;
  }

  private scenarioCaches() {
    const parent = this.openChild;

    const parentHookCache =
      parent instanceof FeatureScope ||
      parent instanceof RuleScope ||
      parent instanceof ScenarioOutlineScope
        ? parent.hookCache
        : this.hookCache;
    const parentStepCache =
      parent instanceof FeatureScope ||
      parent instanceof RuleScope ||
      parent instanceof ScenarioOutlineScope
        ? parent.steps
        : this.steps;
    return { parentHookCache, parentStepCache };
  }
  private ruleCaches() {
    const parent = this.openChild;

    const parentHookCache =
      parent instanceof FeatureScope ? parent.hookCache : this.hookCache;
    const parentStepCache =
      parent instanceof FeatureScope ? parent.steps : this.steps;
    return { parentHookCache, parentStepCache };
  }
}

function featureFallbackErrorMessage(args: unknown[]): never {
  const message = `Invalid arguments for Feature.

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
${JSON.stringify(args, null, 2)}`;
  throw new AutomationError(message);
}

function toExpression(value: string | RegExp, registry: ParameterTypeRegistry) {
  return typeof value === "string"
    ? new CucumberExpression(value, registry)
    : new RegularExpression(value, registry);
}
