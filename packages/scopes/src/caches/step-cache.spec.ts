import { StepScope } from "../step-scope";
import { describe, expect, it } from "vitest";
import { StepCache } from "./step-cache";
import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { StepKeyword, StepType } from "@autometa/gherkin";
import { CachedStep } from "./types";
describe("StepCache", () => {
  describe("add", () => {
    it("should add a new step to the cache", () => {
      const sut = new StepCache("test");
      const step = makeStep("Given", "Context", "hello there");
      sut.add(step);
      const [cached] = getList(sut, "Context");
      expect(sut.size).toEqual(1);
      expect(step).toEqual(cached);
    });

    it("should throw an error if a duplicate step is added", () => {
      const sut = new StepCache("test");
      const step = makeStep("Given", "Context", "hello there");
      const second = makeStep("Given", "Context", "hello there");
      sut.add(step);
      expect(() => sut.add(second)).toThrow(
        "Step [Given hello there] already defined"
      );
    });
  });
  describe("findByExample", () => {
    it("finds a cached step which is part of a gherkin Example", () => {
      const sut = new StepCache("test");
      const step = makeStep("Given", "Context", "hello {word}");
      sut.add(step);
      const found = sut.findByExample("Context", "Given", "hello <thing>", {
        thing: "world",
      });
      expect(found?.step).toEqual(step);
    });
  });
  describe("find", () => {
    it("should throw an error if no step can be found", () => {
      const sut = new StepCache("test");
      const action = () => sut.find("Context", "Given", "hello world");
      expect(action).toThrow(
        "No stored step could be found matching [Given hello world]"
      );
    });
    it("should throw an error with report", () => {
      const sut = new StepCache("test");
      const step = makeStep("Given", "Context", "hello worlds");
      sut.add(step);
      const action = () => sut.find("Context", "Given", "hello world");
      expect(action).toThrow(
        "No stored step could be found matching [Given hello world]"
      );
    });
    it("should find a matching step", () => {
      const sut = new StepCache("test");
      const step = makeStep("Given", "Context", "hello world");
      sut.add(step);
      const found = sut.find("Context", "Given", "hello world");
      expect(found?.step).toEqual(step);
    });
    it("should find a matching parent step", () => {
      const parent = new StepCache("test");
      const sut = new StepCache("test", parent);
      const step = makeStep("Given", "Context", "hello world");
      parent.add(step);
      const found = sut.find("Context", "Given", "hello world");
      expect(found?.step).toEqual(step);
    });

    it("should extract the step args from a step", () => {
      const sut = new StepCache("test");
      const step = makeStep("Given", "Context", "hello {string} {int}");
      sut.add(step);
      const found = sut.find("Context", "Given", "hello 'world' 1");
      expect(found?.args).toBeTypeOf('function');
    });
  });
});
function makeStep(keyword: StepKeyword, context: StepType, text: string): CachedStep {
  return new StepScope(
    keyword,
    context,
    new CucumberExpression(text, new ParameterTypeRegistry()),
    () => undefined
  );
}

function getList(cache: StepCache, type: StepType): CachedStep[] {
  const asRecord = cache as unknown as Record<StepType, unknown>;
  return asRecord[type] as CachedStep[];
}
