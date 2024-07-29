import {
  ExamplesBridge,
  FeatureBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
  find,
  GlobalBridge,
  StepBridge,
} from "@autometa/test-builder";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll,
  jest,
} from "@jest/globals";
import { World, type App } from "@autometa/app";
import { Class } from "@autometa/types";
import { AutomationError, formatErrorCauses, raise } from "@autometa/errors";
import { TestEventEmitter } from "@autometa/events";
import { Query } from "@autometa/test-builder";
import { Config } from "@autometa/config";
import { chooseTimeout } from "./timeout-selector";
import { GlobalScope, NullTimeout, Timeout } from "@autometa/scopes";
import { Container, defineContainerContext } from "@autometa/injection";
export function execute(
  { app, world }: { app: Class<App>; world: Class<World> },
  global: GlobalScope,
  bridge: FeatureBridge,
  events: TestEventEmitter,
  config: Config
) {
  const globalBridge = new GlobalBridge(global);
  const featureTitle = bridge.data.scope.title(bridge.data.gherkin);
  const [group, modifier] = getGroupOrModifier(
    bridge,
    config.current.test?.tagFilter
  );
  const chosenTimeout = chooseTimeout(
    new NullTimeout(),
    bridge.data.scope.timeout
  ).getTimeout(config);
  beforeAll(() => {
    events.feature.emitStart({
      title: featureTitle,
      path: bridge.data.scope.path,
      modifier,
      tags: [...bridge.data.gherkin.tags],
    });
  }, chosenTimeout.milliseconds);
  group(featureTitle, () => {
    const tags = [...bridge.data.gherkin.tags] ?? [];
    const retries = tags.find((tag) => tag.startsWith("@retries="));

    let testContainerContext: symbol;
    let testContainer: Container;
    // = registerContainerContext(app, world);
    let localApp: App;
    const globalContainerContext = defineContainerContext("global");
    const globalContainer = new Container(globalContainerContext);
    globalContainer.registerCached(world);
    const staticApp: App = globalContainer.get(app);
    staticApp.world = globalContainer.get(world);
    staticApp.di = globalContainer;
    beforeAll(() => {
      if (retries) {
        const count = parseInt(retries.split("=")[1]);
        jest.retryTimes(count);
      }
    });
    beforeEach(() => {
      const name =
        expect.getState().currentTestName ?? raise("A test must have a name");
      testContainerContext = defineContainerContext(name);
      testContainer = new Container(testContainerContext);
      testContainer.registerCached(world);
      localApp = testContainer.get(app);
      localApp.world = testContainer.get(world);
      localApp.di = testContainer;
    });

    bootstrapSetupHooks(globalBridge, staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapSetupHooks(bridge, staticApp, events, [config, chosenTimeout]);
    bootstrapBeforeHooks(bridge, globalBridge, () => localApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapBeforeHooks(bridge, bridge, () => localApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapBackground(bridge, bridge, () => localApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapScenarios(bridge, bridge, () => localApp, staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapRules(bridge, () => localApp, staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapAfterHooks(bridge, bridge, () => localApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapAfterHooks(bridge, globalBridge, () => localApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapTeardownHooks(globalBridge, staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapTeardownHooks(bridge, staticApp, events, [config, chosenTimeout]);
  });
  afterAll(async () => {
    // events.
    const failures = Query.find.failed(bridge);
    const status =
      modifier === "skip"
        ? "SKIPPED"
        : failures.length === 0
        ? "PASSED"
        : "FAILED";
    events.feature.emitEnd({
      title: featureTitle,
      modifier,
      tags: [...bridge.data.gherkin.tags],
      status: status,
    });
    const settled = await events.settleAsyncEvents();
    const failedCount = settled.filter((e) => e.status === "rejected").length;
    if (failedCount > 0) {
      const count = `${failedCount}/${settled.length}`;
      const message = `${count} asynchronous Test Events were rejected.`;
      console.warn(message);
    }
  });
}

export function bootstrapBackground(
  root: FeatureBridge,
  bridge: FeatureBridge | RuleBridge,
  localApp: () => App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const background = bridge.background;
  if (!background) return;

  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;

  const tags = bridge?.data?.gherkin?.tags ?? [];
  if (tags.has("@skip") || tags.has("@skipped")) return;
  beforeEach(async () => {
    const testName = expect.getState().currentTestName;
    if (!testName) throw new AutomationError("A Scenario must have a title");
    const scenarioBridge = find(root, testName);
    if (!scenarioBridge) {
      throw new AutomationError(
        `No matching scenario bridge was found matching the test name: ${testName}`
      );
    }
    const title = background.data.scope.title(background.data.gherkin);
    events.before.emitStart({
      title: title,
      tags: [...tags],
    });
    const steps = background.steps;
    try {
      for (const step of steps) {
        const app = localApp();
        const args = step.args?.(app) ?? [];
        const title = step.data.scope.stepText(
          step.data.gherkin.keyword,
          step.data.gherkin.text
        );

        events.step.emitStart({
          title,
          args: args,
          expression: step.data.scope.expression.source,
        });

        await step.data.scope.execute(step.data.gherkin, args, app);

        events.step.emitEnd({
          expression: step.data.scope.expression.source,
          title,
          args: args,
        });
      }
      events.before.emitEnd({
        title: title,
        tags: [...tags],
        status: "PASSED",
      });
    } catch (e) {
      events.before.emitEnd({
        title: title,
        tags: [...tags],
        status: "FAILED",
        error: e as Error,
      });
      const message = `${title} failed to execute.
Test: ${testName}`;
      throw new AutomationError(message, { cause: e as Error });
    }
  }, chosenTimeout);
}
export function bootstrapScenarios(
  root: FeatureBridge,
  bridge: FeatureBridge | RuleBridge | ExamplesBridge,
  localApp: () => App,
  staticApp: App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const { scenarios } = bridge;
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config);
  scenarios.forEach((scenario) => {
    if (isOutline(scenario)) {
      bootstrapScenarioOutline(root, scenario, localApp, staticApp, events, [
        config,
        chosenTimeout,
      ]);
      return;
    }
    bootstrapScenario(scenario, localApp, events, [config, chosenTimeout]);
  });
}

export function bootstrapScenario(
  bridge: ScenarioBridge,
  localApp: () => App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const { data } = bridge;
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config);
  const scenarioName = data.scope.title(data.gherkin);
  const test = getTestOrModifier(bridge, config.current.test?.tagFilter);
  test(
    scenarioName,
    async () => {
      events.scenario.emitStart({
        title: bridge.title,
        tags: bridge.tags,
      });
      try {
        for (const step of bridge.steps) {
          await tryRunStep(step, events, bridge, localApp);
        }
        bridge.report = { passed: true };
        events.scenario.emitEnd({
          title: bridge.title,
          tags: bridge.tags,
          status: "PASSED",
        });
      } catch (e) {
        const error = e as Error;
        bridge.report = { passed: false, error: e as Error };
        events.scenario.emitEnd({
          title: bridge.title,
          tags: bridge.tags,
          status: "FAILED",
          error: error,
        });
        const message = `${bridge.title} failed while executing a step`;
        const meta = { cause: error };
        throw new AutomationError(message, meta);
      }
    },
    chosenTimeout.milliseconds
  );
}

async function tryRunStep(
  step: StepBridge,
  events: TestEventEmitter,
  bridge: ScenarioBridge,
  localApp: () => App
) {
  await bootstrapStep(step, events, bridge, localApp);
}

async function bootstrapStep(
  step: StepBridge,
  events: TestEventEmitter,
  bridge: ScenarioBridge,
  localApp: () => App
) {
  const title = step.data.scope.stepText(
    step.data.gherkin.keyword,
    step.data.gherkin.text
  );
  let args: unknown[] = [];
  try {
    const app = localApp();
    args = step.args?.(app) ?? [];

    events.step.emitStart({
      title,
      args,
      expression: step.expressionText,
    });
    await step.data.scope.execute(step.data.gherkin, args, app);
    events.step.emitEnd({
      expression: step.expressionText,
      title,
      args,
      status: "PASSED",
    });
  } catch (e) {
    const error = e as Error;
    events.step.emitEnd({
      expression: step.expressionText,
      title,
      args,
      status: "FAILED",
      error: e as Error,
    });
    const message = `${title} experienced an error`;
    const meta = { cause: error };
    const newError = new AutomationError(message, meta);
    console.error(formatErrorCauses(newError));
    throw newError;
  }
}

function isOutline(
  data: ScenarioBridge | ScenarioOutlineBridge
): data is ScenarioOutlineBridge {
  return data instanceof ScenarioOutlineBridge;
}

export function bootstrapScenarioOutline(
  root: FeatureBridge,
  bridge: ScenarioOutlineBridge,
  localApp: () => App,
  staticApp: App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const {
    data: { scope, gherkin },
    examples,
  } = bridge;
  const title = scope.title(gherkin);
  const [group, modifier] = getGroupOrModifier(
    bridge,
    config.current.test?.tagFilter
  );
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;
  group(title, () => {
    beforeAll(() => {
      events.scenarioOutline.emitStart({
        title,
        modifier,
        tags: [...gherkin.tags],
      });
    });
    bootstrapSetupHooks(bridge, staticApp, events, [config, timeout]);
    bootstrapBeforeHooks(root, bridge, localApp, events, [config, timeout]);
    examples.forEach((example) => {
      bootstrapExamples(root, example, localApp, staticApp, events, [
        config,
        timeout,
      ]);
    });
    bootstrapAfterHooks(root, bridge, localApp, events, [config, timeout]);
    bootstrapTeardownHooks(bridge, staticApp, events, [config, timeout]);
    afterAll(() => {
      const failures = Query.find.failed(bridge);
      const status = getStatus(modifier, failures);
      events.scenarioOutline.emitEnd({
        title,
        modifier,
        tags: [...gherkin.tags],
        status: status,
      });
    }, chosenTimeout);
  });
}
export function bootstrapExamples(
  root: FeatureBridge,
  example: ExamplesBridge,
  localApp: () => App,
  staticApp: App,
  events: TestEventEmitter,
  timeout: [Config, Timeout]
) {
  const title = example.data.scope.title(example.data.gherkin);
  const [group] = getGroupOrModifier(
    example,
    timeout[0].current.test?.tagFilter
  );
  group(title, () => {
    bootstrapScenarios(root, example, localApp, staticApp, events, timeout);
  });
}

export function bootstrapRules(
  bridge: FeatureBridge,
  localApp: () => App,
  staticApp: App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config);
  bridge.rules.forEach((rule) => {
    const tags = [...rule.data.gherkin.tags] ?? [];
    const retry = tags.find((tag) => tag.startsWith("@retries="));
    const ruleTimeout = chooseTimeout(
      chosenTimeout,
      rule.data.scope.timeout
    ).getTimeout(config);
    const transferTimeout: [Config, Timeout] = [config, ruleTimeout];
    const { data } = rule;
    const ruleName = data.scope.title(data.gherkin);
    const [group, modifier] = getGroupOrModifier(
      bridge,
      config.current.test?.tagFilter
    );

    group(ruleName, () => {
      beforeAll(() => {
        events.rule.emitStart({
          title: ruleName,
          modifier,
          tags: [...data.gherkin.tags],
        });

        if (retry) {
          const count = parseInt(retry.split("=")[1]);
          jest.retryTimes(count);
        }
      });
      bootstrapSetupHooks(rule, staticApp, events, transferTimeout);
      bootstrapBeforeHooks(bridge, rule, localApp, events, transferTimeout);
      bootstrapBackground(bridge, rule, localApp, events, transferTimeout);
      bootstrapScenarios(
        bridge,
        rule,
        localApp,
        staticApp,
        events,
        transferTimeout
      );
      bootstrapAfterHooks(bridge, rule, localApp, events, transferTimeout);
      bootstrapTeardownHooks(rule, staticApp, events, transferTimeout);

      afterAll(() => {
        const failures = Query.find.failed(rule);
        const status = getStatus(modifier, failures);
        events.rule.emitEnd({
          title: ruleName,
          modifier,
          tags: [...data.gherkin.tags],
          status: status,
        });
      }, ruleTimeout.milliseconds);
    });
  });
}

function getStatus(modifier: string | undefined, failures: unknown[]) {
  if (modifier === "skip") {
    return "SKIPPED";
  }
  if (failures.length === 0) {
    return "PASSED";
  }
  return "FAILED";
}

function getGroupOrModifier(
  { data }: RuleBridge | FeatureBridge | ScenarioOutlineBridge | ExamplesBridge,
  tagFilter: string | undefined
) {
  if (data.gherkin.tags?.has("@skip") || data.gherkin.tags?.has("@skipped")) {
    return [describe.skip, "skip"] as const;
  }
  if (data.gherkin.tags?.has("@only")) {
    return [describe.only, "only"] as const;
  }
  if (tagFilter) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parse = require("@cucumber/tag-expressions").default;
    const expression = parse(tagFilter).evaluate([...data.gherkin.tags]);
    if (!expression) {
      return [describe.skip, "skip"] as const;
    }
  }
  return [describe, undefined] as const;
}

function getTestOrModifier({ data }: ScenarioBridge, tagFilter?: string) {
  if (data.gherkin.tags?.has("@skip") || data.gherkin.tags?.has("@skipped")) {
    return it.skip;
  }
  if (data.gherkin.tags?.has("@only")) {
    return it.only;
  }
  if (tagFilter) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parse = require("@cucumber/tag-expressions").default;
    const expression = parse(tagFilter).evaluate([...data.gherkin.tags]);
    if (!expression) {
      return it.skip;
    }
  }
  return it;
}

export function bootstrapBeforeHooks(
  root: FeatureBridge,
  bridge: GlobalBridge | FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  localApp: () => App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config);

  bridge.data.scope.hooks.before.forEach((hook) => {
    const hookTimeout = chooseTimeout(chosenTimeout, hook.timeout).getTimeout(
      config
    ).milliseconds;

    beforeEach(async () => {
      const testName = expect.getState().currentTestName;
      if (!testName) throw new AutomationError("A Scenario must have a title");
      const scenarioBridge = find(root, testName);
      if (!scenarioBridge) {
        throw new AutomationError(
          `No matching scenario was found matching the test name: ${testName}`
        );
      }
      if (!hook.canExecute(...scenarioBridge.data.gherkin.tags)) {
        return;
      }
      const tags = scenarioBridge?.data?.gherkin?.tags ?? [];
      events.before.emitStart({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
      });
      const report = await hook.execute(localApp(), ...tags);
      events.before.emitEnd({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
        status: report.status,
        error: report.error,
      });
      if (report.error) {
        const message = `${hook.name}: ${hook.description} experienced a failure.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}
export function bootstrapSetupHooks(
  bridge: GlobalBridge | FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  staticApp: App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const { scope, gherkin } = bridge.data;
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;
  const setups = scope.hooks.setup;
  setups.forEach((hook) => {
    const hookTimeout = chooseTimeout(
      Timeout.from(chosenTimeout),
      hook.timeout
    ).getTimeout(config).milliseconds;
    const tags = gherkin.tags ?? [];

    beforeAll(async () => {
      if (!hook.canExecute(...tags)) {
        return;
      }

      events.setup.emitStart({
        title: `${hook.name}: ${hook.description}`,
      });

      const report = await hook.execute(staticApp, ...tags);

      events.setup.emitEnd({
        title: `${hook.name}: ${hook.description}`,
        status: report.status,
        error: report.error,
      });

      if (report.error) {
        const message = `${hook.name}: ${hook.description} failed to execute.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}

export function bootstrapAfterHooks(
  root: FeatureBridge,
  bridge: GlobalBridge | FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  localApp: () => App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const { scope } = bridge.data;
  const chosenTimeout = chooseTimeout(timeout, scope.timeout).getTimeout(
    config
  ).milliseconds;
  scope.hooks.after.forEach((hook) => {
    const hookTimeout = chooseTimeout(
      Timeout.from(chosenTimeout),
      hook.timeout
    ).getTimeout(config).milliseconds;
    afterEach(async () => {
      const testName = expect.getState().currentTestName;
      if (!testName) throw new AutomationError("A Scenario must have a title");
      const scenarioBridge = find(root, testName);
      if (!scenarioBridge) {
        throw new AutomationError(
          `No scenario was found matching the test path: ${testName}`
        );
      }
      if (!hook.canExecute(...scenarioBridge.data.gherkin.tags)) {
        return;
      }
      const tags = scenarioBridge?.data?.gherkin?.tags ?? [];
      events.after.emitStart({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
      });

      const report = await hook.execute(localApp(), ...tags);
      events.after.emitEnd({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
        status: report.status,
        error: report.error,
      });
      if (report.error) {
        const message = `${hook.name}: ${hook.description} failed to execute.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}

export function bootstrapTeardownHooks(
  bridge: GlobalBridge | FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  staticApp: App,
  event: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const tags = bridge.data.gherkin.tags ?? [];
  const { scope } = bridge.data;
  const chosenTimeout = chooseTimeout(timeout, scope.timeout).getTimeout(
    config
  );
  scope.hooks.teardown.forEach((hook) => {
    const hookTimeout = chooseTimeout(chosenTimeout, hook.timeout).getTimeout(
      config
    ).milliseconds;
    afterAll(async () => {
      if (!hook.canExecute(...tags)) {
        return;
      }
      event.teardown.emitStart({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
      });
      const report = await hook.execute(staticApp, ...tags);
      event.teardown.emitEnd({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
        status: report.status,
        error: report.error,
      });

      if (report.error) {
        const message = `${hook.name}: ${hook.description} failed to execute.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}
