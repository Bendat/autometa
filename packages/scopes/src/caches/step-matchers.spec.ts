import {
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import { Empty_Function } from "../novelties";
import { StepScope } from "../step-scope";
import { describe, it, expect } from "vitest";
import {
  checkMatch,
  getDiff,
  getDiffs,
  isExpressionCandidate,
  limitDiffs,
  refineDiff
} from "./search/step-matcher";
const registry = new ParameterTypeRegistry();
registry.defineParameterType(
  new ParameterType("task:builder", [/.*/], String, Empty_Function)
);
const type = "Context";
const keyword = "Given";
describe("step matcher", () => {
  it("should find an exact match in the wrong step", () => {
    const expression = new CucumberExpression("hello world", registry);
    const step = new StepScope("Given", "Context", expression, Empty_Function);
    const matches = checkMatch("hello world", step);
    expect(matches).toBe(true);
  });
  describe("isExpressionCandidate", () => {
    it("should return true if the change is a candidate for an expression", () => {
      const change1 = { removed: true, value: "2" };
      const change2 = { added: true, value: "{int}" };
      expect(isExpressionCandidate(change1, change2)).toBe(true);
    });
    it("should return false if the change is not a candidate for an expression", () => {
      const change1 = { removed: true, value: "2" };
      const change2 = { added: true, value: "bowl" };
      expect(isExpressionCandidate(change1, change2)).toBe(false);
    });
  });
  describe("getDiff", () => {
    it("it should get no difference between a matching text and expression", () => {
      const text = "I have 2 grapes in my bowl";
      const expression = new CucumberExpression(
        "I have {int} grapes in my {string}",
        registry
      );
      const step = new StepScope(keyword, type, expression, Empty_Function);

      const diff = getDiff(text, step);
      const expected = [
        { count: 4, value: "I have " },
        { count: 1, added: undefined, removed: true, value: "2" },
        { count: 3, added: true, removed: undefined, value: "{int}" },
        { count: 7, value: " grapes in my " },
        { count: 1, added: undefined, removed: true, value: "bowl" },
        { count: 3, added: true, removed: undefined, value: "{string}" }
      ];
      expect(diff).toStrictEqual(expected);
    });
  });
  describe("refineDiff", () => {
    it("should get the diff of a matching text and expression", () => {
      const refined = refineDiff([
        { count: 4, value: "I have " },
        { count: 1, added: undefined, removed: true, value: "2" },
        { count: 3, added: true, removed: undefined, value: "{int}" },
        { count: 7, value: " grapes in my " },
        { count: 1, added: undefined, removed: true, value: "bowl" },
        { count: 3, added: true, removed: undefined, value: "{string}" }
      ]);
      expect(refined).toEqual("I have 2 grapes in my bowl");
    });
  });
  describe("refineDiff", () => {
    it("should get the diffs of a similar text and expression", () => {
      const text = "I have 2 grapes in my bowl";
      const expression = new CucumberExpression(
        "I have {int} blue grapes in my {string}",
        registry
      );
      const step = new StepScope(keyword, type, expression, Empty_Function);
      const diffs = getDiff(text, step);
      const refined = refineDiff(diffs);
      expect(refined).toEqual("I have 2 blue grapes in my bowl");
    });
    it("should get the diffs of a matching text and expression", () => {
      const text = "I have 2 grapes in my bowl";
      const expression = new CucumberExpression(
        "I have {int} grapes in my {string}",
        registry
      );
      const step = new StepScope(keyword, type, expression, Empty_Function);
      const diffs = getDiff(text, step);
      const refined = refineDiff(diffs);
      expect(refined).toEqual(text);
    });
  });
  describe("getDiffs", () => {
    it("should get all the diffs and levanstein distances between a text and a step", () => {
      const text = "I have 2 grapes in my bowl";
      const expression = new CucumberExpression(
        "I have {int} blue grapes in my {string}",
        registry
      );
      const scope = new StepScope(keyword, type, expression, Empty_Function);
      const [diffs] = getDiffs(text, 1, [scope]);
      expect(diffs).not.toBeUndefined();
      expect(diffs).not.toBeNull();
      const { merged, step, gherkin, distance } = diffs;
      expect(merged).toEqual("I have 2 blue grapes in my bowl");
      expect(step).toEqual(scope);
      expect(gherkin).toEqual(text);
      expect(distance).toEqual(5);
    });
    it("should only return the number results capped by the limit", () => {
      const text = "I have 2 grapes in my bowl";
      const expression = new CucumberExpression(
        "I have {int} blue grapes in my {string}",
        registry
      );
      const expression1 = new CucumberExpression(
        "I have {int} blue drapes in my {string}",
        registry
      );
      const scope = new StepScope(keyword, type, expression, Empty_Function);
      const scope1 = new StepScope(keyword, type, expression1, Empty_Function);
      const diffs = getDiffs(text, 1, [scope, scope1]);
      expect(diffs).toHaveLength(1);
      const [diff] = diffs;
      const { merged, step, gherkin, distance } = diff;
      expect(merged).toEqual("I have 2 blue grapes in my bowl");
      expect(step).toEqual(scope);
      expect(gherkin).toEqual(text);
      expect(distance).toEqual(5);
    });
  });
  describe("limitDiffs", () => {
    it("should limit a diff to only same step types when smaller distance than other step types", () => {
      const sameTypeDiff1 = {
        merged: "",
        step: testStep,
        gherkin: "",
        distance: 1
      };
      const sameTypeDiff2 = {
        merged: "",
        step: testStep,
        gherkin: "",
        distance: 2
      };
      const otherTypeDiff = {
        merged: "",
        step: testStepOther,
        gherkin: "",
        distance: 5
      };
      const otherTypeDiff2 = {
        merged: "I have 2 blue drapes in my bowl",
        step: testStepOther,
        gherkin: "",
        distance: 6
      };
      //   const diffs = [sameTypeDiff1, sameTypeDiff2, otherTypeDiff];
      const sameDiffs = [sameTypeDiff1, sameTypeDiff2];
      const otherDiffs = [otherTypeDiff, otherTypeDiff2];
      const { same, other } = limitDiffs(sameDiffs, otherDiffs, 2);
      expect(same[0]).toEqual(sameTypeDiff1);
      expect(other).toHaveLength(0);
    });
    it("should split the diff between same and other types when the others have some lower distances", () => {
      const sameTypeDiff1 = {
        merged: "",
        step: testStep,
        gherkin: "",
        distance: 1
      };
      const sameTypeDiff2 = {
        merged: "",
        step: testStep,
        gherkin: "",
        distance: 6
      };
      const otherTypeDiff = {
        merged: "",
        step: testStepOther,
        gherkin: "",
        distance: 1
      };
      const otherTypeDiff2 = {
        merged: "I have 2 blue drapes in my bowl",
        step: testStepOther,
        gherkin: "",
        distance: 6
      };
      const sameDiffs = [sameTypeDiff1, sameTypeDiff2];
      const otherDiffs = [otherTypeDiff, otherTypeDiff2];
      const { same, other } = limitDiffs(sameDiffs, otherDiffs, 2);
      expect(same[0]).toEqual(sameTypeDiff1);
      expect(other[0]).toEqual(otherTypeDiff);
    });
    it("should limit diff to same type when it exceeds max limit", () => {
      const sameTypeDiff1 = {
        merged: "",
        step: testStep,
        gherkin: "",
        distance: 1
      };
      const sameTypeDiff2 = {
        merged: "",
        step: testStep,
        gherkin: "",
        distance: 2
      };
      const otherTypeDiff = {
        merged: "",
        step: testStepOther,
        gherkin: "",
        distance: 2
      };
      const otherTypeDiff2 = {
        merged: "I have 2 blue drapes in my bowl",
        step: testStepOther,
        gherkin: "",
        distance: 6
      };
      const sameDiffs = [sameTypeDiff1, sameTypeDiff2];
      const otherDiffs = [otherTypeDiff, otherTypeDiff2];
      const { same, other } = limitDiffs(sameDiffs, otherDiffs, 1);
      expect(same[0]).toEqual(sameTypeDiff1);
      expect(other).toHaveLength(0);
    });
  });
});

const testStep = new StepScope(
  "Given",
  "Context",
  new CucumberExpression("I have {int} blue grapes in my {string}", registry),
  Empty_Function
);
const testStepOther = new StepScope(
  "When",
  "Action",
  new CucumberExpression("I have {int} blue drapes in my {string}", registry),
  Empty_Function
);
