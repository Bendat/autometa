import {
  ExamplesBuilder,
  FeatureBuilder,
  RuleBuilder,
  ScenarioBuilder,
  ScenarioOutlineBuilder,
  StepBuilder,
} from "@autometa/gherkin";
import { describe, vi, it, beforeEach, expect } from "vitest";
import { GherkinWalker, WalkFunctionMap } from "./gherkin-walker";

const gherkinDocument = new FeatureBuilder()
  .name("my feature")
  .children([
    new RuleBuilder()
      .name("my rule")
      .children([
        new ScenarioBuilder()
          .name("my scenario")
          .children([
            new StepBuilder().keyword("Given").text("my setup").build(),
          ])
          .build(),
      ])
      .build(),
    new ScenarioOutlineBuilder()
      .name("my scenario outline")
      .children([
        new ExamplesBuilder()
          .name("my examples")
          .children([
            new ScenarioBuilder()
              .name("my scenario outline")
              .children([
                new StepBuilder().keyword("When").text("my action").build(),
              ])
              .build(),
          ])
          .build(),
        new ExamplesBuilder()
          .name("my examples")
          .children([
            new ScenarioBuilder()
              .name("my scenario outline")
              .children([
                new StepBuilder().keyword("When").text("my action").build(),
              ])
              .build(),
          ])
          .build(),
      ])
      .build(),
  ])
  .build();
const walkers: WalkFunctionMap<[]> = {
  onFeature: vi.fn().mockReturnValue([]),
  onRule: vi.fn().mockReturnValue([]),
  onBackground: vi.fn().mockReturnValue([]),
  onScenario: vi.fn().mockReturnValue([]),
  onScenarioOutline: vi.fn().mockReturnValue([]),
  onExamples: vi.fn().mockReturnValue([]),
  onStep: vi.fn().mockReturnValue([]),
};
const {
  onFeature,
  onRule,
  onBackground,
  onScenario,
  onScenarioOutline,
  onExamples,
  onStep,
} = walkers;

beforeEach(() => {
  vi.clearAllMocks();
});
describe("GherkinWalker", () => {
  it("should walk the gherkin document for a feature", () => {
    GherkinWalker.walk<[]>(walkers, gherkinDocument, []);
    expect(onFeature).toHaveBeenCalledTimes(1);
    expect(onRule).toHaveBeenCalledTimes(1);
    expect(onBackground).toHaveBeenCalledTimes(0);
    expect(onScenario).toHaveBeenCalledTimes(3);
    expect(onScenarioOutline).toHaveBeenCalledTimes(1);
    expect(onExamples).toHaveBeenCalledTimes(2);
    expect(onStep).toHaveBeenCalledTimes(3);
  });
});
