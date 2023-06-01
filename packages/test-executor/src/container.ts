import {
  ExternalHookWrappers,
  FeatureData,
  GroupData,
  StepData,
  TestData,
  TestGroup,
} from "./types";
// import { FrameworkTestCall } from "./types";
import { Class, FrameworkTestCall } from "@autometa/types";
import { App, getApp } from "@autometa/app";
import { Step } from "@autometa/gherkin";
import { AutomationError } from "@autometa/errors";
import { Scenario } from "@autometa/gherkin";
import { Scope } from "@autometa/scopes";
import { EventSubscriber } from "@autometa/events";
import { isTagsMatch } from "@autometa/gherkin";
import { Bind } from "@autometa/bind-decorator";
import { GlobalScope } from "@autometa/scopes";

export abstract class TestContainer {
  app: App;
  appType: Class<App>;
  topLevelApp: App;
  constructor(readonly name: string) {}
  data: GroupData | TestData;
  error?: AutomationError;
  events: EventSubscriber;
  withData(data: TestData | GroupData | StepData) {
    this.data = data;
    return this;
  }
  withApp(app: App) {
    this.app = app;
    return this;
  }

  withTopLevelApp(app: App) {
    this.topLevelApp = app;
    return this;
  }

  toString() {
    return `[${this.constructor.name}${this.name}]`;
  }
  withEvents(events: EventSubscriber) {
    this.events = events;
    return this;
  }

  abstract run(): void | Error | Promise<void | Error>;
}

export class FeatureBridge extends TestContainer {
  declare data: FeatureData;
  children: (RuleBridge | ScenarioBridge)[] = [];
  openRule?: RuleBridge;
  openOutline?: TestGroupContainer;
  openExample?: TestGroupContainer;
  openScenario?: ScenarioBridge;
  describe: TestGroup;
  hooks: ExternalHookWrappers;
  tagExpression: string | undefined;

  get group() {
    const { scope, gherkin } = this.data;
    if (!isTagsMatch([...gherkin.tags], this.tagExpression)) {
      return this.describe.skip;
    }
    return scope?.skip === true
      ? this.describe.skip
      : scope?.only === true
      ? this.describe.only
      : this.describe;
  }
  get isSkipped() {
    const { scope, gherkin } = this.data;
    if (!isTagsMatch([...gherkin.tags], this.tagExpression)) {
      return true;
    }
    return scope?.skip === true;
  }
  run(): void | Error | Promise<void | Error> {
    const { scope, gherkin } = this.data;
    this.group(scope.title(gherkin), () => {
      let app: App;
      const appGetter = () => app
      for (const child of this.children) {
      
        this.hooks.beforeEach?.(() => {
          app = getApp(this.appType);
          const { gherkin, scope } = child.data;
          // for(const hook of scope.hooks.before)
        });
        if (child instanceof ScenarioBridge) {
          this.events.onScenarioStart?.({
            title: scope.title(gherkin),
            tags: [...gherkin.tags],
          });
        }
      }
    });
  }
  withAppType(app: Class<App>) {
    this.appType = app;
    return this;
  }

  addScenario(name: string, data: TestData) {
    this.openOutline = undefined;
    // if (this.openRule) {
    //   this.openRule.addScenario(name, data);
    //   return this.children.at(-1) as Test;
    // }
    const test = new ScenarioBridge(name).withData(data);
    this.children.push(test);
    this.openScenario = test;
    return this.children.at(-1) as Test;
  }

  addRule(name: string, data: GroupData) {
    this.openExample = undefined;
    this.openOutline = undefined;
    this.openScenario = undefined;
    this.openRule = new RuleBridge(name).withData(data);
    this.children.push(this.openRule);
    return this.openRule;
  }

  withTagExpression(expression: string) {
    this.tagExpression = expression;
    return this;
  }
}
export class StepBridge extends TestContainer {
  declare data: StepData;

  run() {
    const { gherkin, scope } = this.data;
    const args = scope.getArgs(gherkin.text);
    return scope.execute(gherkin, args, this.app);
  }
}
export class ScenarioBridge extends TestContainer {
  declare data: TestData;
  children: StepBridge[] = [];
  test: FrameworkTestCall;
  events: EventSubscriber;
  tagExpression: string | undefined;
  get it() {
    const { scope, gherkin } = this.data;
    if (!isTagsMatch([...gherkin.tags], this.tagExpression)) {
      return this.test.skip;
    }
    return scope?.skip === true
      ? this.test.skip
      : scope?.only === true
      ? this.test.only
      : this.test;
  }
  get isSkipped() {
    const { scope, gherkin } = this.data;
    if (!isTagsMatch([...gherkin.tags], this.tagExpression)) {
      return true;
    }
    return scope?.skip === true;
  }
  @Bind
  run(): void | Error {
    return this.it(this.name, async () => {
      for (const child of this.children) {
        this.startStep(child);
        const result = await child.run();
        this.endStep(child, this.isSkipped, result);
        if (result instanceof Error) {
          const { gherkin, scope } = this.data;
          const message = `${scope?.title(
            gherkin.keyword
          )} failed while executing a step. Message is:
          
  ${result.message}`;
          const newError = new AutomationError(message);
          newError.stack = result.stack;
          this.error = newError;
          throw newError;
        }
      }
    });
  }

  private startStep(child: StepBridge) {
    const { gherkin, scope } = child.data as StepData;
    const { keyword, text } = gherkin;
    const { expression } = scope;
    const args = scope.getArgs(gherkin.text);
    this.events.onStepStart?.({ keyword, text, expression, args });
  }

  private endStep(child: StepBridge, skipped: boolean, error: Error | undefined) {
    const { gherkin, scope } = child.data as StepData;
    const { keyword, text } = gherkin;
    const { expression } = scope;
    const status = skipped ? "SKIPPED" : error ? "FAILED" : "PASSED";
    this.events.onStepEnd?.({ keyword, text, expression, error, status });
  }
  withTagExpression(expression: string) {
    this.tagExpression = expression;
    return this;
  }
  withStep(name: string, data: StepData) {
    this.children.push(new StepBridge(name).withData(data));
    return this as ScenarioBridge;
  }

  withTestFunction(test: FrameworkTestCall, appFactory: () => App) {
    this.test = test;
    this.app = appFactory();
    return this;
  }
}

export class RuleBridge extends TestContainer {
  run(): void | Error | Promise<void | Error> {
    throw new Error("Method not implemented.");
  }
}
export class TestStep extends TestContainer {
  data: StepData;

  async run() {
    const { scope, gherkin } = this.data;
    const { text, keyword } = gherkin;
    const { expression } = scope;
    const args = scope.getArgs(gherkin.text);
    this.events.onStepStart?.({ text, keyword, args, expression });
    const error = await scope.execute(gherkin, args, this.app);
    if (error) {
      const newErr = new AutomationError(`Step failed: "${gherkin.keyword} ${gherkin.text}"

failed with message:
  ${error.message}

Implementation expression was '${scope.expression.source}'.
`);
      newErr.stack = error.stack;
      this.error = newErr;
      this.events.onStepEnd?.({ text, keyword, expression, error: newErr, status: "FAILED" });
      // throw newErr;
      return newErr;
    }
    this.events.onStepEnd?.({ text, keyword, expression, status: "PASSED" });
  }
  constructor(readonly name: string, readonly events: EventSubscriber) {
    super(name);
  }
}

class ActionHistory {
  constructor(
    readonly scope: Scope,
    readonly status: "success" | "failure" | "skipped",
    readonly error?: Error
  ) {}
}

export class Test extends TestContainer {
  hooks: Pick<ExternalHookWrappers, "afterEach" | "beforeEach">;
  data: TestData;
  steps: TestStep[] = [];
  test: FrameworkTestCall;
  constructor(name: string, readonly events: EventSubscriber) {
    super(name);
  }
  get keyword() {
    return this.data.gherkin?.keyword;
  }
  get titleString() {
    return `${this.keyword}: ${this.name}`;
  }
  async runBefore() {
    const tags = this.data.gherkin?.tags ?? [];
    const hooks = this.data.scope?.hooks;
    if (hooks?.before) {
      for (const hook of hooks.before) {
        this.events.onBeforeStart?.({ description: hook.name, tags, args: [this.app] });
        const { status, description, error } = await hook.execute(this.app, ...tags);
        this.events.onBeforeEnd?.({ description, status, error });
        if (error instanceof Error) {
          const message = `Before hook "${description}" failed with message: 

    ${error.message}`;
          const newErr = new AutomationError(message);
          newErr.stack = error.stack;
          this.error = newErr;
          return error;
        }
      }
    }
  }
  async runAfter() {
    const tags = this.data.gherkin?.tags ?? [];
    const hooks = this.data.scope?.hooks;
    if (hooks?.before) {
      for (const hook of hooks.before) {
        this.events.onAfterStart?.({ description: hook.name, tags, args: [this.app] });
        const { status, description, error } = await hook.execute(this.app, ...tags);
        this.events.onAfterEnd?.({ description, status, error });
        if (error instanceof Error) {
          const message = `After hook "${description}" failed with message: 

    ${error.message}`;
          const newErr = new AutomationError(message);
          newErr.stack = error.stack;
          this.error = newErr;
          return error;
        }
      }
    }
  }
  async runSteps() {
    for (const step of this.steps) {
      step.app = this.app;
      const error = await step.run();
      if (error) {
        return error;
      }
    }
  }
  async run() {
    const { gherkin, scope } = this.data;
    const hooks = this.data.scope?.hooks;
    const tags = this.data.gherkin?.tags ?? [];
    const testFn =
      scope?.skip === true ? this.test.skip : scope?.only === true ? this.test.only : this.test;
    testFn(this.name, async () => {
      this.runSteps();
    });
  }

  addStep(name: string, data: StepData) {
    this.steps.push(new TestStep(name).withData(data));
    return this.steps.at(-1) as TestStep;
  }

  withTestFunction(test: TestFunction, appFactory: () => App) {
    this.test = test;
    this.app = appFactory();
    return this;
  }

  withHooks(hooks: Pick<ExternalHookWrappers, "afterEach" | "beforeEach">) {
    this.hooks = hooks;
    return this;
  }
}

export class TestGroupContainer extends TestContainer {
  declare data: GroupData;
  children: (TestGroupContainer | Test | TestStep)[] = [];
  openRule?: TestGroupContainer;
  openOutline?: TestGroupContainer;
  openExample?: TestGroupContainer;
  openScenario?: Test;
  describe: TestGroup;
  hooks: ExternalHookWrappers;

  constructor(readonly name: string) {
    super(name);
  }

  get keyword() {
    return this.data.gherkin?.keyword;
  }

  get titleString() {
    return `${this.keyword}: ${this.name}`;
  }

  run(): void {
    const describe = this.data.scope?.skip ? this.describe.skip : this.describe;
    const hooks = this.data.scope?.hooks;
    describe(this.titleString, () => {
      this.data.scope?.onStart(this.data.gherkin);
      this.hooks.beforeEach(() => {
        this.data.scope?.onStart(this.data.gherkin);
      });
      this.hooks.afterEach(() => {
        this.data.scope?.onEnd();
      });
      if (hooks) {
        hooks?.setup?.forEach((ba) => {
          this.hooks.beforeAll(() => ba.execute(this.topLevelApp));
        });
        hooks?.setup?.forEach((ba) => {
          this.hooks.afterAll(() => ba.execute(this.topLevelApp));
        });
      }
      for (const child of this.children) {
        child.run();
      }
    });
  }

  withTestFunctions(describe: TestGroup, test: TestFunction, appFactory: () => App) {
    this.describe = describe;
    this.children.forEach((child) => {
      if (child instanceof TestGroupContainer) {
        child.withTestFunctions(describe, test, appFactory).withTopLevelApp(this.topLevelApp);
      }
      if (child instanceof Test) {
        child.withTestFunction(test, appFactory).withHooks(this.hooks);
      }
    });
    return this;
  }

  withHooks(hooks: ExternalHookWrappers) {
    this.hooks = hooks;
    return this;
  }

  withData(data: Partial<TestGroupContainer["data"]>) {
    this.data = { ...this.data, ...data };
    return this;
  }

  addScenario(name: string, data: TestData) {
    this.openOutline = undefined;
    if (this.openRule) {
      this.openRule.addScenario(name, data);
      return this.children.at(-1) as Test;
    }
    const test = new Test(name).withData(data);
    this.children.push(test);
    this.openScenario = test;
    return this.children.at(-1) as Test;
  }

  addOutline(name: string, data: GroupData): TestGroupContainer {
    this.openExample = undefined;
    this.openScenario = undefined;
    if (this.openRule) {
      return this.openRule.addOutline(name, data);
    }
    const group = new TestGroupContainer(name).withData(data);
    this.children.push(group);
    this.openOutline = group;
    return this.openOutline;
  }

  addExamples(name: string, data: GroupData): TestGroupContainer {
    this.openScenario = undefined;
    const example = new TestGroupContainer(name).withData(data);
    this.children.push(example);
    return example;
  }

  addStep(name: string, data: StepData) {
    if (this.openScenario) {
      this.openScenario.addStep(name, data);
      return this.children.at(-1) as TestStep;
    }
    throw new Error(`No open scenario, cannot add step ${data}`);
  }

  addRule(name: string, data: GroupData) {
    this.openExample = undefined;
    this.openOutline = undefined;
    this.openScenario = undefined;
    this.openRule = new TestGroupContainer(name).withData(data);
    this.children.push(this.openRule);
    return this.openRule;
  }
}
