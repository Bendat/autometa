import {
  ExamplesBridge,
  FeatureBridge,
  RuleBridge,
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
export function execute(
  { app, world }: { app: Class<AutometaApp>; world: Class<AutometaWorld> },
  bridge: FeatureBridge
) {
  const featureTitle = bridge.data.scope.title(bridge.data.gherkin);
  describe(featureTitle, () => {
    let localApp: App;
    const staticApp: App = getApp(app, world);
    beforeEach(() => {
      localApp = getApp(app, world);
    });
    bootstrapSetupHooks(bridge, staticApp);
    bootstrapBeforeHooks(bridge, () => localApp);
    bootstrapScenarios(bridge, () => localApp);
    bootstrapRules(bridge, () => localApp, staticApp)
    bootstrapAfterHooks(bridge, () => localApp);
    bootstrapTeardownHooks(bridge, staticApp);
  });
}
export function bootstrapBackground(
  bridge: FeatureBridge | RuleBridge,
  localApp: () => App
){
  const background = bridge.background;
  if (!background) return;
  const testName = expect.getState().currentTestName;
  if (!testName) throw new AutomationError("A Scenario must have a title");
  const scenarioBridge = find(bridge, testName);
  if (!scenarioBridge) {
    throw new AutomationError(
      `No matching scenario bridge was found matching the test name: ${testName}`
    );
  }
  const tags = bridge?.data?.gherkin?.tags ?? [];
  beforeEach(async () => {
    const report = await background.execute(localApp(), ...tags);
    if (report.error) {
      throw report.error;
    }
  }

}
export function bootstrapScenarios(
  { scenarios }: FeatureBridge | RuleBridge | ExamplesBridge,
  localApp: () => App
) {
  scenarios.forEach((scenario) => {
    const { data } = scenario;
    const scenarioName = data.scope.title(data.gherkin);

    if (data instanceof ScenarioOutlineBridge) {
      bootstrapScenarioOutline(data, localApp);
      return;
    }
    let test: typeof it | typeof it.skip = it;

    if (
      scenario.data.gherkin.tags?.has("@skip") ||
      scenario.data.gherkin.tags?.has("@skipped")
    ) {
      test = it.skip;
    }
    test(scenarioName, async () => {
      for (const step of scenario.steps) {
        await step.data.scope.execute(step.data.gherkin, localApp());
      }
    });
  });
}

export function bootstrapScenarioOutline(
  { data: { scope, gherkin }, examples }: ScenarioOutlineBridge,
  localApp: () => App
) {
  const title = scope.title(gherkin);
  let group: (name: string, action: () => unknown) => unknown = describe;
  if (gherkin.tags?.has("@skip") || gherkin.tags?.has("@skipped")) {
    group = describe.skip;
  }
  group(title, () => {
    examples.forEach((example) => {
      bootstrapExamples(example, localApp);
    });
  });
}
export function bootstrapExamples(
  example: ExamplesBridge,
  localApp: () => App
) {
  const title = example.data.scope.title(example.data.gherkin);
  const {
    data: { gherkin }
  } = example;
  let group: typeof describe | typeof describe.skip = describe;
  if (gherkin.tags?.has("@skip") || gherkin.tags?.has("@skipped")) {
    group = describe.skip;
  }
  group(title, () => {
    bootstrapScenarios(example, localApp);
  });
}

export function bootstrapRules(
  bridge: FeatureBridge,
  localApp: () => App,
  staticApp: App
) {
  bridge.rules.forEach(({ data }) => {
    let group: typeof describe | typeof describe.skip = describe;
    const ruleName = data.scope.title(data.gherkin);
    if (data.gherkin.tags?.has("@skip") || data.gherkin.tags?.has("@skipped")) {
      group = describe.skip;
    }
    group(ruleName, () => {
      bootstrapSetupHooks(bridge, staticApp);
      bootstrapBeforeHooks(bridge, localApp);
      bootstrapScenarios(bridge, localApp);
      bootstrapAfterHooks(bridge, localApp);
      bootstrapTeardownHooks(bridge, staticApp);
    });
  });
}
export function bootstrapBeforeHooks(
  bridge: FeatureBridge | RuleBridge,
  localApp: () => App
) {
  bridge.data.scope.hooks.before.forEach((hook) => {
    const testName = expect.getState().currentTestName;
    if (!testName) throw new AutomationError("A Scenario must have a title");
    const scenarioBridge = find(bridge, testName);
    if (!scenarioBridge) {
      throw new AutomationError(
        `No matching scenario was found matching the test name: ${testName}`
      );
    }
    const tags = scenarioBridge?.data?.gherkin?.tags ?? [];
    beforeEach(async () => {
      const report = await hook.execute(localApp(), ...tags);
      if (report.error) {
        throw report.error;
      }
    });
  });
}
export function bootstrapSetupHooks(bridge: FeatureBridge, staticApp: App) {
  bridge.data.scope.hooks.setup.forEach((hook) => {
    const tags = bridge.data.gherkin.tags ?? [];

    beforeAll(async () => {
      const report = await hook.execute(staticApp, ...tags);
      if (report.error) {
        throw report.error;
      }
    });
  });
}

export function bootstrapAfterHooks(
  bridge: FeatureBridge,
  localApp: () => App
) {
  bridge.data.scope.hooks.after.forEach((hook) => {
    const testName = expect.getState().currentTestName;
    if (!testName) throw new AutomationError("A Scenario must have a title");
    const scenarioBridge = find(bridge, testName);
    if (!scenarioBridge) {
      throw new AutomationError(
        `No matching scenario bridge was found matching the test name: ${testName}`
      );
    }
    const tags = scenarioBridge?.data?.gherkin?.tags ?? [];
    afterEach(async () => {
      const report = await hook.execute(localApp(), ...tags);
      if (report.error) {
        throw report.error;
      }
    });
  });
}

export function bootstrapTeardownHooks(bridge: FeatureBridge, staticApp: App) {
  bridge.data.scope.hooks.teardown.forEach((hook) => {
    afterAll(async () => {
      const tags = bridge.data.gherkin.tags ?? [];
      const report = await hook.execute(staticApp, ...tags);
      if (report.error) {
        throw report.error;
      }
    });
  });
}
