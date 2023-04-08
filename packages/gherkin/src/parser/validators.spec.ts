import { Background, Rule, Scenario } from "@cucumber/messages";
import { describe, it, expect } from "@jest/globals";
import { ScenarioOutline } from "src/groups";
import {
  isBackground,
  isRule,
  isScenario,
  isScenarioOutline,
} from "./validators";

describe("is Rule", () => {
  it("should return true if an object is a Rule", () => {
    const obj = { rule: { name: "bob" } as unknown as Rule };
    if (!isRule(obj)) {
      throw new Error("Object should be a rule wrapper");
    }
    expect(obj.rule).toEqual({ name: "bob" });
  });
  it("should return false if an object is not a Rule", () => {
    const obj = { scenario: { name: "bob" } as unknown as Scenario };
    expect(isRule(obj)).toBe(false);
  });
});

describe("is Scenario Outline", () => {
  it("should return true if an object is a Scenario with an Examples table", () => {
    const obj = {
      scenario: { name: "bob", examples: [{}] } as unknown as Scenario,
    };
    if (!isScenarioOutline(obj)) {
      throw new Error("Object should be a rule wrapper");
    }
    expect(obj.scenario).toEqual({ name: "bob", examples: [{}] });
  });
  it("should return false if an object is a Scenario without an Examples table", () => {
    const obj = { scenario: { name: "bob" } as unknown as Scenario };
    expect(isScenarioOutline(obj)).toBe(false);
  });
  it("should return false if an object is not a Scenario", () => {
    const obj = { rule: { name: "bob" } } as unknown as { rule: Rule };
    expect(isScenarioOutline(obj)).toBe(false);
  });
});

describe("is Scenario", () => {
  it("should return true if an object is a Scenario", () => {
    const obj = { scenario: { name: "bob" } as unknown as Scenario };
    if (!isScenario(obj)) {
      throw new Error("Object should be a rule wrapper");
    }
    expect(obj.scenario).toEqual({ name: "bob" });
  });
  it("should return false if an object is not a Scenario", () => {
    const obj = { rule: { name: "bob" } as unknown as Rule };
    expect(isScenario(obj)).toBe(false);
  });
});
describe("is Background", () => {
  it("should return true if an object is a Background", () => {
    const obj = { background: { name: "bob" } as unknown as Background };
    if (!isBackground(obj)) {
      throw new Error("Object should be a rule wrapper");
    }
    expect(obj.background).toEqual({ name: "bob" });
  });
  it("should return false if an object is not a Scenario", () => {
    const obj = { scenario: { name: "bob" } } as unknown as {
      background: Background;
    };
    expect(isBackground(obj)).toBe(false);
  });
});
