/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, vi, beforeEach, expect as assert } from "vitest";
import {
  describe as group,
  it as test,
  beforeEach as before,
  expect
} from "@jest/globals";
import {
  makeBackground,
  makeExamples,
  makeFeature,
  makeRule,
  makeScenario,
  makeScenarioOutline
} from "./__it__/integration.utils";
import { App } from "@autometa/app";
import { TestEventEmitter } from "@autometa/events";
import {
  bootstrapBackground,
  bootstrapExamples,
  bootstrapScenario,
  bootstrapScenarioOutline,
  bootstrapScenarios
} from "./executor";
vi.mock("@jest/globals", () => {
  const it = vi.fn();
  attachMock(it, "skip");
  attachMock(it, "only");
  const describe = vi.fn();
  attachMock(describe, "skip");
  attachMock(describe, "only");

  return {
    describe,
    it,
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    afterAll: vi.fn(),
    beforeAll: vi.fn(),
    expect: vi.fn()
  };
});
const events = new TestEventEmitter() as unknown as TestEventEmitter;
function attachMock(fn: (...args: unknown[]) => unknown, property: string) {
  const asDict = fn as unknown as Record<string, unknown>;
  asDict[property] = vi.fn();
  return fn;
}

const localApp = () => ({} as unknown as App);
const staticApp = {} as unknown as App;
beforeEach(() => {
  vi.clearAllMocks();
});
function getExpect() {
  return expect as unknown as {
    getState: () => { currentTestName: string };
  };
}
describe("boostrapBackground", () => {
  it("should bootstrap a Background in a Feature", () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: "Feature: My Feature Scenario: My Scenario"
    }));

    const feature = makeFeature("My Feature");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    feature.background = background;
    feature.scenarios = [scenario];
    bootstrapBackground(feature, localApp, events);
    assert(before).toHaveBeenCalled();
  });
  it("should bootstrap a Background in a Rule", () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: "Rule: My Rule Scenario: My Scenario"
    }));

    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    rule.background = background;
    rule.scenarios = [scenario];
    bootstrapBackground(rule, localApp, events);
    assert(before).toHaveBeenCalled();
  });
  it('should skip a Background with the "@skip" tag in the Feature', () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: "Feature: My Feature Scenario: My Scenario"
    }));

    const feature = makeFeature("My Feature");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    feature.background = background;
    feature.scenarios = [scenario];
    feature.data.gherkin.tags.add("@skip");
    bootstrapBackground(feature, localApp, events);
    assert(before).not.toHaveBeenCalled();
  });
  it('should skip a Background with the "@skip" tag', () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: "Rule: My Rule Scenario: My Scenario"
    }));

    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    rule.background = background;
    rule.scenarios = [scenario];
    rule.data.gherkin.tags.add("@skip");
    bootstrapBackground(rule, localApp, events);
    assert(before).not.toHaveBeenCalled();
  });
  it('should skip a Background with the "@skipped" tag', () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: "Rule: My Rule Scenario: My Scenario"
    }));

    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    rule.background = background;
    rule.scenarios = [scenario];
    rule.data.gherkin.tags.add("@skipped");
    bootstrapBackground(rule, localApp, events);
    assert(before).not.toHaveBeenCalled();
  });
  it("should throw an error if testName is undefined", () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: undefined as unknown as string
    }));

    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    rule.background = background;
    rule.scenarios = [scenario];
    assert(() => bootstrapBackground(rule, localApp, events)).toThrowError(
      "A Scenario must have a title"
    );
  });
  it("should throw an error if a matching Scenario cannot be found", () => {
    getExpect().getState = vi.fn(() => ({
      currentTestName: "Rule: My Rule2 Scenario: My Scenario"
    }));

    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    const background = makeBackground("My Background");
    rule.background = background;
    rule.scenarios = [scenario];
    assert(() => bootstrapBackground(rule, localApp, events)).toThrowError(
      "No matching scenario bridge was found matching the test name: Rule: My Rule2 Scenario: My Scenario"
    );
  });
});

describe("bootstrapScenario", () => {
  it("should bootstrap a Scenario in a Feature", () => {
    const feature = makeFeature("My Feature");
    const scenario = makeScenario("My Scenario");
    feature.scenarios = [scenario];
    bootstrapScenario(scenario, localApp, events);
    assert(test).toHaveBeenCalled();
  });
  it("should bootstrap a Scenario in a Rule", () => {
    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    rule.scenarios = [scenario];
    bootstrapScenario(scenario, localApp, events);
    assert(test).toHaveBeenCalled();
  });
  it("should bootstrap a Scenario in a Scenario Outline", () => {
    const scenarioOutline = makeScenarioOutline("My Scenario Outline");
    const examples = makeExamples("My Examples");
    const scenario = makeScenario("My Scenario");
    scenarioOutline.examples = [examples];
    examples.scenarios = [scenario];
    bootstrapScenario(scenario, localApp, events);
    assert(test).toHaveBeenCalled();
  });
  it('should skip a Scenario with the "@skip" tag in the Feature', () => {
    const scenario = makeScenario("My Scenario");
    scenario.data.gherkin.tags.add("@skip");
    bootstrapScenario(scenario, localApp, events);
    assert(test.skip).toHaveBeenCalled();
  });
});

describe("bootstrapScenarios & bootstrapExamples", () => {
  it("should bootstrap a Scenario in a Feature", () => {
    const feature = makeFeature("My Feature");
    const scenario = makeScenario("My Scenario");
    feature.scenarios = [scenario];
    bootstrapScenarios(feature, localApp, staticApp, events);
    assert(test).toHaveBeenCalled();
  });
  it("should bootstrap a Scenario in a Rule", () => {
    const rule = makeRule("My Rule");
    const scenario = makeScenario("My Scenario");
    rule.scenarios = [scenario];
    bootstrapScenarios(rule, localApp, staticApp, events);
    assert(test).toHaveBeenCalled();
  });
  it("should bootstrap a Scenario in a Scenario Outline", () => {
    const examples = makeExamples("My Examples");
    const scenario = makeScenario("My Scenario");
    examples.scenarios = [scenario];
    bootstrapScenarios(examples, localApp, staticApp, events);
    assert(test).toHaveBeenCalled();
  });
  it('should skip a Scenario with the "@skip"', () => {
    const examples = makeExamples("My Examples");
    const scenario = makeScenario("My Scenario");
    examples.scenarios = [scenario];
    examples.data.gherkin.tags.add("@skip");
    scenario.data.gherkin.tags.add("@skip");
    bootstrapExamples(examples, localApp, staticApp, events);
    assert(group.skip).toHaveBeenCalled();
  });
});

describe("bootstrapScenarioOutline", () => {
  it("should bootstrap a Scenario in a Scenario Outline", () => {
    const scenarioOutline = makeScenarioOutline("My Scenario Outline");
    const examples = makeExamples("My Examples");
    const scenario = makeScenario("My Scenario");
    scenarioOutline.examples = [examples];
    examples.scenarios = [scenario];
    bootstrapScenarioOutline(scenarioOutline, localApp, staticApp, events);
    assert(group).toHaveBeenCalled();
  });

  it('should skip a Scenario Outline with the "@skip" tag', () => {
    const scenarioOutline = makeScenarioOutline("My Scenario Outline");
    scenarioOutline.data.gherkin.tags.add("@skip");
    bootstrapScenarioOutline(scenarioOutline, localApp, staticApp, events);
    assert(group.skip).toHaveBeenCalled();
  });
});
