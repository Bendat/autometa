import {
  ExamplesBridge,
  FeatureBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
  find
} from "@autometa/test-builder";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  beforeAll
} from "@jest/globals";
import { type App, AutometaApp, AutometaWorld, getApp } from "@autometa/app";
import { Class } from "@autometa/types";
import { AutomationError } from "@autometa/errors";
import { TestEventEmitter } from "@autometa/events";
import { Query } from "@autometa/test-builder";
import { Config } from "@autometa/config";
import { chooseTimeout } from "./timeout-selector";
import { NullTimeout, Timeout } from "@autometa/scopes";
export function execute(
  { app, world }: { app: Class<AutometaApp>; world: Class<AutometaWorld> },
  bridge: FeatureBridge,
  events: TestEventEmitter,
  config: Config
) {
  config.current;
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
      tags: [...bridge.data.gherkin.tags]
    });
  }, chosenTimeout.milliseconds);
  group(featureTitle, () => {
    let localApp: App;
    const staticApp: App = getApp(app, world);
    beforeEach(() => {
      localApp = getApp(app, world);
    });

    bootstrapSetupHooks(bridge, staticApp, events, [config, chosenTimeout]);
    bootstrapBeforeHooks(bridge, bridge, () => localApp, events, [
      config,
      chosenTimeout
    ]);
    bootstrapBackground(bridge, bridge, () => localApp, events, [
      config,
      chosenTimeout
    ]);
    bootstrapScenarios(bridge, bridge, () => localApp, staticApp, events, [
      config,
      chosenTimeout
    ]);
    bootstrapRules(bridge, () => localApp, staticApp, events, [
      config,
      chosenTimeout
    ]);
    bootstrapAfterHooks(bridge, bridge, () => localApp, events, [
      config,
      chosenTimeout
    ]);
    bootstrapTeardownHooks(bridge, staticApp, events, [config, chosenTimeout]);
  });
  afterAll(() => {
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
      status: status
    });
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
      tags: [...tags]
    });
    const steps = background.steps;
    try {
      for (const step of steps) {
        await step.data.scope.execute(
          background.data.gherkin,
          step.data.gherkin,
          localApp()
        );
      }
      events.before.emitEnd({
        title: title,
        tags: [...tags],
        status: "PASSED"
      });
    } catch (e) {
      events.before.emitEnd({
        title: title,
        tags: [...tags],
        status: "FAILED",
        error: e as Error
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
        chosenTimeout
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
  const test = getTestOrModifier(bridge);
  test(
    scenarioName,
    async () => {
      events.scenario.emitStart({
        title: scenarioName,
        tags: [...data.gherkin.tags]
      });
      try {
        for (const step of bridge.steps) {
          await step.data.scope.execute(
            bridge.data.gherkin,
            step.data.gherkin,
            localApp()
          );
        }
        bridge.report = { passed: true };
        events.scenario.emitEnd({
          title: scenarioName,
          tags: [...data.gherkin.tags],
          status: "PASSED"
        });
      } catch (e) {
        events.scenario.emitEnd({
          title: scenarioName,
          tags: [...data.gherkin.tags],
          status: "FAILED",
          error: e as Error
        });
        bridge.report = { passed: false, error: e as Error };
        const message = `${scenarioName} failed to execute.`;
        throw new AutomationError(message, { cause: e as Error });
      }
    },
    chosenTimeout.milliseconds
  );
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
    examples
  } = bridge;
  const title = scope.title(gherkin);
  const [group, modifier] = getGroupOrModifier(bridge);
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;
  group(title, () => {
    beforeAll(() => {
      events.scenarioOutline.emitStart({
        title,
        modifier,
        tags: [...gherkin.tags]
      });
    });
    bootstrapSetupHooks(bridge, staticApp, events, [config, timeout]);
    bootstrapBeforeHooks(root, bridge, localApp, events, [config, timeout]);
    examples.forEach((example) => {
      bootstrapExamples(root, example, localApp, staticApp, events, [
        config,
        timeout
      ]);
    });
    bootstrapAfterHooks(root, bridge, localApp, events, [config, timeout]);
    bootstrapTeardownHooks(bridge, staticApp, events, [config, timeout]);
    afterAll(() => {
      const failures = Query.find.failed(bridge);
      const status =
        modifier === "skip"
          ? "SKIPPED"
          : failures.length === 0
          ? "PASSED"
          : "FAILED";
      events.scenarioOutline.emitEnd({
        title,
        modifier,
        tags: [...gherkin.tags],
        status: status
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
  const [group] = getGroupOrModifier(example);
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
          tags: [...data.gherkin.tags]
        });
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
        const status =
          modifier === "skip"
            ? "SKIPPED"
            : failures.length === 0
            ? "PASSED"
            : "FAILED";
        events.rule.emitEnd({
          title: ruleName,
          modifier,
          tags: [...data.gherkin.tags],
          status: status
        });
      }, ruleTimeout.milliseconds);
    });
  });
}

function getGroupOrModifier({
  data
}: RuleBridge | FeatureBridge | ScenarioOutlineBridge | ExamplesBridge) {
  if (data.gherkin.tags?.has("@skip") || data.gherkin.tags?.has("@skipped")) {
    return [describe.skip, "skip"] as const;
  }
  if (data.gherkin.tags?.has("@only")) {
    return [describe.only, "only"] as const;
  }
  return [describe, undefined] as const;
}

function getTestOrModifier({ data }: ScenarioBridge) {
  if (data.gherkin.tags?.has("@skip") || data.gherkin.tags?.has("@skipped")) {
    return it.skip;
  }
  if (data.gherkin.tags?.has("@only")) {
    return it.only;
  }
  return it;
}

export function bootstrapBeforeHooks(
  root: FeatureBridge,
  bridge: FeatureBridge | RuleBridge | ScenarioOutlineBridge,
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
      if (!hook.canExecute(...bridge.data.gherkin.tags)) {
        return;
      }
      const tags = scenarioBridge?.data?.gherkin?.tags ?? [];
      events.before.emitStart({
        title: hook.name,
        tags: [...tags]
      });
      const report = await hook.execute(localApp(), ...tags);
      events.before.emitEnd({
        title: hook.name,
        tags: [...tags],
        status: report.status,
        error: report.error
      });
      if (report.error) {
        const message = `${hook.name}: ${hook.description} failed to execute.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}
export function bootstrapSetupHooks(
  bridge: FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  staticApp: App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;
  bridge.data.scope.hooks.setup.forEach((hook) => {
    const hookTimeout = chooseTimeout(
      Timeout.from(chosenTimeout),
      hook.timeout
    ).getTimeout(config).milliseconds;
    const tags = bridge.data.gherkin.tags ?? [];

    beforeAll(async () => {
      if (!hook.canExecute(...tags)) {
        return;
      }
      events.setup.emitStart({
        title: hook.name
      });
      const report = await hook.execute(staticApp, ...tags);

      events.setup.emitEnd({
        title: hook.name,
        status: report.status,
        error: report.error
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
  bridge: FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  localApp: () => App,
  events: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config).milliseconds;
  bridge.data.scope.hooks.after.forEach((hook) => {
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
          `No matching scenario bridge was found matching the test name: ${testName}`
        );
      }
      if (!hook.canExecute(...bridge.data.gherkin.tags)) {
        return;
      }
      const tags = scenarioBridge?.data?.gherkin?.tags ?? [];
      events.after.emitStart({
        title: hook.name,
        tags: [...tags]
      });

      const report = await hook.execute(localApp(), ...tags);
      events.after.emitEnd({
        title: hook.name,
        tags: [...tags],
        status: report.status,
        error: report.error
      });
      if (report.error) {
        const message = `${hook.name}: ${hook.description} failed to execute.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}

export function bootstrapTeardownHooks(
  bridge: FeatureBridge | RuleBridge | ScenarioOutlineBridge,
  staticApp: App,
  event: TestEventEmitter,
  [config, timeout]: [Config, Timeout]
) {
  const tags = bridge.data.gherkin.tags ?? [];
  const chosenTimeout = chooseTimeout(
    timeout,
    bridge.data.scope.timeout
  ).getTimeout(config);
  bridge.data.scope.hooks.teardown.forEach((hook) => {
    const hookTimeout = chooseTimeout(chosenTimeout, hook.timeout).getTimeout(
      config
    ).milliseconds;
    afterAll(async () => {
      event.teardown.emitStart({
        title: hook.name,
        tags: [...tags]
      });
      const report = await hook.execute(staticApp, ...tags);
      event.teardown.emitEnd({
        title: hook.name,
        tags: [...tags],
        status: report.status,
        error: report.error
      });

      if (report.error) {
        const message = `${hook.name}: ${hook.description} failed to execute.`;
        throw new AutomationError(message, { cause: report.error });
      }
    }, hookTimeout);
  });
}
