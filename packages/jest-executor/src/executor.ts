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
import { isTagsMatch } from "@autometa/gherkin";

const outlineApps = new Map<string, App[]>();
const examplesApps = new Map<string, App[]>();
const featureApps = new Map<string, App[]>();
const ruleApps = new Map<string, App[]>();

export function execute(
  { app, world }: { app: Class<App>; world: Class<World> },
  global: GlobalScope,
  bridge: FeatureBridge,
  events: TestEventEmitter,
  config: Config
) {
  const globalBridge = new GlobalBridge(global);
  const featureTitle = bridge.data.scope.title(bridge.data.gherkin);
  const [group, modifier] = getGroupOrModifier(bridge);
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
      if (!featureApps.has(name)) {
        featureApps.set(name, []);
      }
      featureApps.get(name)?.push(localApp);
    });

    bridge.data.scope.hooks.beforeFeatureHooks.forEach((hook) => {
      const hookTimeout = chooseTimeout(
        chosenTimeout,
        hook.options.timeout
      ).getTimeout(config).milliseconds;
      beforeAll(async () => {
        const tags = bridge?.data?.gherkin?.tags ?? [];
        if (!hook.canExecute(...tags)) {
          return;
        }
        events.beforeFeature.emitStart({
          title: hook.description,
          tags: [...tags],
        });
        const report = await hook.execute(staticApp, ...tags);
        if (report.error) {
          const message = `${hook.name}: ${hook.description} failed to execute.`;
          events.beforeFeature.emitEnd({
            title: hook.description,
            tags: [...tags],
            status: "FAILED",
            error: report.error,
          });
          throw new AutomationError(message, { cause: report.error });
        }
        events.beforeFeature.emitEnd({
          title: hook.description,
          tags: [...tags],
          status: "PASSED",
        });
      }, hookTimeout);
    });

    bridge.data.scope.hooks.afterFeatureHooks.forEach((hook) => {
      const hookTimeout = chooseTimeout(
        chosenTimeout,
        hook.options.timeout
      ).getTimeout(config).milliseconds;
      afterAll(async () => {
        const tags = bridge?.data?.gherkin?.tags ?? [];
        if (!hook.canExecute(...bridge.data.gherkin.tags)) {
          return;
        }
        events.afterFeature.emitStart({
          title: hook.description,
          tags: [...tags],
        });

        const testName = expect.getState().currentTestName as string;
        const apps = featureApps.get(testName) as App[];
        const report = await hook.execute(staticApp, apps, ...tags);
        if (report.error) {
          const message = `${hook.name}: ${hook.description} failed to execute.`;
          events.afterFeature.emitEnd({
            title: hook.description,
            tags: [...tags],
            status: "FAILED",
            error: report.error,
          });
          throw new AutomationError(message, { cause: report.error });
        }
        events.afterFeature.emitEnd({
          title: hook.description,
          tags: [...tags],
          status: "PASSED",
        });
      }, hookTimeout);
    });

    bootstrapSetupHooks(globalBridge, staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapSetupHooks(bridge, staticApp, events, [config, chosenTimeout]);
    bootstrapBeforeHooks(
      bridge,
      globalBridge,
      () => [testContainer, localApp],
      events,
      [config, chosenTimeout]
    );
    bootstrapBeforeHooks(
      bridge,
      bridge,
      () => [testContainer, localApp],
      events,
      [config, chosenTimeout]
    );
    bootstrapBackground(
      bridge,
      bridge,
      () => [testContainer, localApp],
      events,
      [config, chosenTimeout]
    );
    bootstrapScenarios(
      bridge,
      bridge,
      () => [testContainer, localApp],
      staticApp,
      events,
      [config, chosenTimeout]
    );
    bootstrapRules(bridge, () => [testContainer, localApp], staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapAfterHooks(
      bridge,
      bridge,
      () => [testContainer, localApp],
      events,
      [config, chosenTimeout]
    );
    bootstrapAfterHooks(
      bridge,
      globalBridge,
      () => [testContainer, localApp],
      events,
      [config, chosenTimeout]
    );
    bootstrapTeardownHooks(globalBridge, staticApp, events, [
      config,
      chosenTimeout,
    ]);
    bootstrapTeardownHooks(bridge, staticApp, events, [config, chosenTimeout]);

    afterAll(async () => {
      await globalContainer.disposeGlobal(tags, isTagsMatch);
    });
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
    featureApps.clear();
    outlineApps.clear();
    examplesApps.clear();
    ruleApps.clear();
  });
}

export function bootstrapBackground(
  root: FeatureBridge,
  bridge: FeatureBridge | RuleBridge,
  localApp: () => [Container, App],
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
        const [_, app] = localApp();
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
  localApp: () => [Container, App],
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
  localApp: () => [Container, App],
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
      const [container, app] = localApp();
      try {
        for (const step of bridge.steps) {
          await tryRunStep(step, events, bridge, () => app);
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
      } finally {
        await container.disposeAll(bridge.tags, isTagsMatch);
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
  localApp: () => [Container, App],
  staticApp: App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const {
    data: { scope, gherkin },
    examples,
  } = bridge;
  const title = scope.title(gherkin);
  const retry = [...gherkin.tags].find((tag) => tag.startsWith("@retries="));
  const { beforeScenarioOutlineHooks, afterScenarioOutlineHooks } = scope.hooks;

  const [group, modifier] = getGroupOrModifier(bridge);
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;
  const original = localApp;
  localApp = () => {
    const testName = expect.getState().currentTestName as string;
    if (!outlineApps.has(testName)) {
      outlineApps.set(testName, []);
    }
    const apps = outlineApps.get(testName) as App[];
    const [container, app] = original();
    apps.push(app);
    return [container, app];
  };

  group(title, () => {
    beforeScenarioOutlineHooks.forEach((hook) => {
      const hookTimeout = chooseTimeout(
        timeout,
        hook.options.timeout
      ).getTimeout(config).milliseconds;
      beforeAll(async () => {
        if (!hook.canExecute(...gherkin.tags)) {
          return;
        }
        events.beforeScenarioOutline.emitStart({
          title,
          modifier,
          tags: [...gherkin.tags],
        });
        const tags = gherkin.tags ?? [];
        events.beforeScenarioOutline.emitStart({
          title,
          modifier,
          tags: [...gherkin.tags],
        });
        const report = await hook.execute(staticApp, ...tags);
        if (report.error) {
          const message = `${hook.name}: ${hook.description} failed to execute.`;
          events.beforeScenarioOutline.emitEnd({
            title,
            modifier,
            error: report.error,
            tags: [...gherkin.tags],
            status: "FAILED",
          });
          throw new AutomationError(message, { cause: report.error });
        }
        events.beforeScenarioOutline.emitEnd({
          title,
          modifier,
          tags: [...gherkin.tags],
          status: "PASSED",
        });
      }, hookTimeout);
    });

    beforeAll(() => {
      if (retry) {
        const count = parseInt(retry.split("=")[1]);
        jest.retryTimes(count);
      }
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

    afterScenarioOutlineHooks.forEach((hook) => {
      const hookTimeout = chooseTimeout(
        timeout,
        hook.options.timeout
      ).getTimeout(config).milliseconds;
      afterAll(async () => {
        if (!hook.canExecute(...gherkin.tags)) {
          return;
        }
        const testName = expect.getState().currentTestName as string;
        const tags = gherkin.tags ?? [];
        const apps = outlineApps.get(testName) as App[];
        events.afterScenarioOutline.emitStart({
          title,
          modifier,
          tags: [...gherkin.tags],
        });
        const report = await hook.execute(staticApp, apps, ...tags);
        if (report.error) {
          const message = `${hook.name}: ${hook.description} failed to execute.`;
          events.scenarioOutline.emitEnd({
            title,
            modifier,
            error: report.error,
            tags: [...gherkin.tags],
            status: "FAILED",
          });
          throw new AutomationError(message, { cause: report.error });
        }
        events.afterScenarioOutline.emitEnd({
          title,
          modifier,
          tags: [...gherkin.tags],
          status: "PASSED",
        });
      }, hookTimeout);
    });

    afterAll(() => {
      const failures = Query.find.failed(bridge);
      const status = getStatus(modifier, failures);
      events.scenarioOutline.emitEnd({
        title,
        modifier,
        tags: [...gherkin.tags],
        status: status,
      });
      outlineApps.clear();
      examplesApps.clear();
    }, chosenTimeout);
  });
}
export function bootstrapExamples(
  root: FeatureBridge,
  example: ExamplesBridge,
  localApp: () => [Container, App],
  staticApp: App,
  events: TestEventEmitter,
  timeout: [Config, Timeout]
) {
  const { gherkin } = example.data;
  const title = `${gherkin.keyword}: ${gherkin.name}`;
  const retry = [...example.data.gherkin.tags].find((tag) =>
    tag.startsWith("@retries=")
  );
  const original = localApp;
  localApp = () => {
    const testName = expect.getState().currentTestName ?? "unnamed test";
    if (!examplesApps.has(testName)) {
      examplesApps.set(testName, []);
    }
    const apps = examplesApps.get(testName) as App[];
    const [container, app] = original();
    apps.push(app);
    return [container, app];
  };

  const [group] = getGroupOrModifier(example);
  group(title, () => {
    beforeAll(() => {
      if (retry) {
        const count = parseInt(retry.split("=")[1]);
        jest.retryTimes(count);
      }
    });

    example.data.scope.hooks.beforeExamplesHooks.forEach((hook) => {
      const hookTimeout = chooseTimeout(
        timeout[1],
        hook.options.timeout
      ).getTimeout(timeout[0]).milliseconds;

      beforeAll(async () => {
        if (!hook.canExecute(...example.data.gherkin.tags)) {
          return;
        }

        const tags = example?.data?.gherkin?.tags ?? [];

        events.beforeExamples.emitStart({
          title,
          tags: [...tags],
        });

        const report = await hook.execute(staticApp, ...tags);

        if (report.error) {
          const message = `${hook.name}: ${hook.description} failed to execute.`;
          events.beforeExamples.emitEnd({
            title,
            error: report.error,
            tags: [...tags],
            status: "FAILED",
          });
          throw new AutomationError(message, { cause: report.error });
        }
        events.beforeExamples.emitEnd({
          title,
          tags: [...tags],
          status: "PASSED",
        });
      }, hookTimeout);
    });
    bootstrapScenarios(root, example, localApp, staticApp, events, timeout);

    example.data.scope.hooks.afterExamplesHooks.forEach((hook) => {
      const hookTimeout = chooseTimeout(
        timeout[1],
        hook.options.timeout
      ).getTimeout(timeout[0]).milliseconds;

      afterAll(async () => {
        const testName = expect.getState().currentTestName as string;
        if (!hook.canExecute(...example.data.gherkin.tags)) {
          return;
        }

        const tags = example?.data?.gherkin?.tags ?? [];
        const apps = examplesApps.get(testName) as App[];
        const report = await hook.execute(staticApp, apps, ...tags);

        if (report.error) {
          const message = `${hook.name}: ${hook.description} failed to execute.`;
          throw new AutomationError(message, { cause: report.error });
        }
      }, hookTimeout);
    });

    afterAll(() => {
      const testName = expect.getState().currentTestName;
      examplesApps.delete(testName as string);
    });
  });
}

export function bootstrapRules(
  bridge: FeatureBridge,
  localApp: () => [Container, App],
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
    const [group, modifier] = getGroupOrModifier(bridge);

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
        const original = localApp;
        localApp = () => {
          const testName = expect.getState().currentTestName as string;
          if (!ruleApps.has(testName)) {
            ruleApps.set(testName, []);
          }
          const apps = ruleApps.get(testName) as App[];
          const [container, app] = original();
          apps.push(app);
          return [container, app];
        };
      });
      bridge.data.scope.hooks.beforeRuleHooks.forEach((hook) => {
        const hookTimeout = chooseTimeout(
          ruleTimeout,
          hook.options.timeout
        ).getTimeout(config).milliseconds;
        beforeAll(async () => {
          if (!hook.canExecute(...data.gherkin.tags)) {
            return;
          }
          const tags = data.gherkin.tags ?? [];
          events.beforeRule.emitStart({
            title: `${hook.name}: ${hook.description}`,
            tags: [...tags],
          });
          const report = await hook.execute(staticApp, ...tags);
          if (report.error) {
            const message = `${hook.name}: ${hook.description} failed to execute.`;
            events.beforeRule.emitEnd({
              title: `${hook.name}: ${hook.description}`,
              tags: [...tags],
              status: "FAILED",
              error: report.error,
            });
            throw new AutomationError(message, { cause: report.error });
          }
          events.beforeRule.emitEnd({
            title: `${hook.name}: ${hook.description}`,
            tags: [...tags],
            status: "PASSED",
          });
        }, hookTimeout);
      });

      bridge.data.scope.hooks.afterRuleHooks.forEach((hook) => {
        const hookTimeout = chooseTimeout(
          ruleTimeout,
          hook.options.timeout
        ).getTimeout(config).milliseconds;
        afterAll(async () => {
          const testName = expect.getState().currentTestName as string;
          if (!hook.canExecute(...data.gherkin.tags)) {
            return;
          }
          const tags = data.gherkin.tags ?? [];
          const apps = ruleApps.get(testName) as App[];
          events.afterRule.emitStart({
            title: `${hook.name}: ${hook.description}`,
            tags: [...tags],
          });
          const report = await hook.execute(staticApp, apps, ...tags);
          if (report.error) {
            const message = `${hook.name}: ${hook.description} failed to execute.`;
            events.afterRule.emitEnd({
              title: `${hook.name}: ${hook.description}`,
              tags: [...tags],
              status: "FAILED",
              error: report.error,
            });
            throw new AutomationError(message, { cause: report.error });
          }
          events.afterRule.emitEnd({
            title: `${hook.name}: ${hook.description}`,
            tags: [...tags],
            status: "PASSED",
          });
        }, hookTimeout);
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
        const testName = expect.getState().currentTestName as string;
        ruleApps.delete(testName);
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
  bridge: RuleBridge | FeatureBridge | ScenarioOutlineBridge | ExamplesBridge
) {
  const { data } = bridge;
  if (data.gherkin.tags?.has("@skip") || data.gherkin.tags?.has("@skipped")) {
    return [describe.skip, "skip"] as const;
  }
  if (data.gherkin.tags?.has("@only")) {
    return [describe.only, "only"] as const;
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
  localApp: () => [Container, App],
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config);

  bridge.data.scope.hooks.before.forEach((hook) => {
    const hookTimeout = chooseTimeout(
      chosenTimeout,
      hook.options.timeout
    ).getTimeout(config).milliseconds;

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
      const report = await hook.execute(localApp()[1], ...tags);
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
      hook.options.timeout
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
  localApp: () => [Container, App],
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
      hook.options.timeout
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

      const report = await hook.execute(localApp()[1], ...tags);
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
  const tags = [...bridge.data.gherkin.tags] ?? [];
  const { scope } = bridge.data;
  const chosenTimeout = chooseTimeout(timeout, scope.timeout).getTimeout(
    config
  );
  scope.hooks.teardown.forEach((hook) => {
    const hookTimeout = chooseTimeout(
      chosenTimeout,
      hook.options.timeout
    ).getTimeout(config).milliseconds;
    afterAll(async () => {
      if (!hook.canExecute(...tags)) {
        return;
      }
      event.teardown.emitStart({
        title: `${hook.name}: ${hook.description}`,
        tags: [...tags],
      });
      const report = await hook.execute(staticApp, tags);
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
