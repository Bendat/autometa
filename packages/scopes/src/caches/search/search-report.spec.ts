import stripColor from "strip-color";
import { describe, it, expect } from "vitest";
import {
  DifferentStepTypeMatch,
  Empty_Function,
  FuzzySearchReport,
  SameStepTypeMatch,
  StepDiff,
  StepScope
} from "../..";
import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
const registery = new ParameterTypeRegistry();
describe("StepMatch", () => {
  describe("SameStepTypeMatch", () => {
    it("should format the match", () => {
      const diff: StepDiff = {
        gherkin: "I have 2 grapes in my bowl",
        merged: "I have {int} blue grapes in my {string}",
        distance: 4,
        step: new StepScope(
          "Given",
          "Context",
          new CucumberExpression("", registery),
          Empty_Function
        )
      };
      const match = new SameStepTypeMatch(diff);
      expect(stripColor(match.toString())).toEqual(
        "[4] Given I have {int} blue grapes in my {string}"
      );
    });
  });
  describe("DifferentStepTypeMatch", () => {
    it("should format the match", () => {
      const diff: StepDiff = {
        gherkin: "I have 2 grapes in my bowl",
        merged: "I have {int} blue grapes in my {string}",
        distance: 4,
        step: new StepScope(
          "When",
          "Action",
          new CucumberExpression("", registery),
          Empty_Function
        )
      };
      const match = new DifferentStepTypeMatch(diff);
      console.log(match.toString());
      expect(stripColor(match.toString())).toEqual(
        "[4] When I have {int} blue grapes in my {string}"
      );
    });
  });
});
describe("SearchReport", () => {
  it("should format the match with same step type", () => {
    const diff: StepDiff = {
      gherkin: "I have 2 grapes in my bowl",
      merged: "I have {int} blue grapes in my {string}",
      distance: 4,
      step: new StepScope(
        "Given",
        "Action",
        new CucumberExpression("", registery),
        Empty_Function
      )
    };
    const match = new SameStepTypeMatch(diff);
    const report = new FuzzySearchReport()
      .addHeading("Scenario: a test scenario")
      .addMatch(match);
    console.log(report.toString());
  });
  it("should format the match with different step type", () => {
    const diff: StepDiff = {
      gherkin: "I have 2 grapes in my bowl",
      merged: "I have {int} blue grapes in my {string}",
      distance: 4,
      step: new StepScope(
        "When",
        "Action",
        new CucumberExpression("", registery),
        Empty_Function
      )
    };
    const match = new DifferentStepTypeMatch(diff);
    const report = new FuzzySearchReport()
      .addHeading("Scenario: a test scenario")
      .addMatch(match);
    console.log(report.toString());
  });
  it("should format the match with same and different step type", () => {
    const diff: StepDiff = {
      gherkin: "I have 2 grapes in my bowl",
      merged: "I have {int} blue grapes in my {string}",
      distance: 4,
      step: new StepScope(
        "Given",
        "Action",
        new CucumberExpression("", registery),
        Empty_Function
      )
    };
    const match = new SameStepTypeMatch(diff);
    const diff2: StepDiff = {
      gherkin: "I have 2 grapes in my bowl",
      merged: "I have {int} blue grapes in my {string}",
      distance: 4,
      step: new StepScope(
        "When",
        "Action",
        new CucumberExpression("", registery),
        Empty_Function
      )
    };
    const match2 = new DifferentStepTypeMatch(diff2);
    const report = new FuzzySearchReport()
      .addHeading("Scenario: a test scenario")
      .addMatch(match)
      .addMatch(match2);
    console.log(report.toString());
  });
  it("should format the match with steps and children with steps", () => {
    const diff: StepDiff = {
      gherkin: "I have 2 grapes in my bowl",
      merged: "I have {int} blue grapes in my {string}",
      distance: 4,
      step: new StepScope(
        "Given",
        "Action",
        new CucumberExpression("", registery),
        Empty_Function
      )
    };
    const match = new SameStepTypeMatch(diff);
    const diff2: StepDiff = {
      gherkin: "I have 2 grapes in my bowl",
      merged: "I have {int} blue grapes in my {string}",
      distance: 2,
      step: new StepScope(
        "When",
        "Action",
        new CucumberExpression("", registery),
        Empty_Function
      )
    };
    const match2 = new DifferentStepTypeMatch(diff2);
    const report = new FuzzySearchReport()
      .addHeading("Scenario: a test scenario")
      .addMatch(match)
      .addMatch(match2);
    const report2 = new FuzzySearchReport()
      .addHeading("Feature: a test feature")
      .addMatch(match)
      .addMatch(match2)
      .addChild(report);
    console.log(report2.toString());
  });
});
