import {
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { it, describe, expect, vi } from "vitest";
import { FeatureScope } from "./feature-scope";
import { GetCucumberFunctions } from "./get-scopes";

describe("GetCucumberFunctions", () => {
  const { Feature, Rule, Scenario, ScenarioOutline } = GetCucumberFunctions(
    null as unknown as ParameterTypeRegistry,
    () => undefined
  );

  it("should attach a skip and only to FeatureScope", () => {
    expect(Feature).toHaveProperty("skip");
    expect(Feature.skip).toBeTypeOf("function");
    expect(Feature).toHaveProperty("only");
    expect(Feature.only).toBeTypeOf("function");

    const feature = Feature.skip("foo", vi.fn());
    expect(feature).toBeInstanceOf(FeatureScope);
    expect(feature.alts.skip).toEqual(true);
  });
  it("should attach a skip and only to RuleScope", () => {
    expect(Rule).toHaveProperty("skip");
    expect(Rule.skip).toBeTypeOf("function");
    expect(Rule).toHaveProperty("only");
    expect(Rule.only).toBeTypeOf("function");
  });
  it("should attach a skip and only to Scenario", () => {
    expect(Scenario).toHaveProperty("skip");
    expect(Scenario.skip).toBeTypeOf("function");
    expect(Scenario).toHaveProperty("only");
    expect(Scenario.only).toBeTypeOf("function");
  });
  it("should attach a skip and only to ScenarioOutline", () => {
    expect(ScenarioOutline).toHaveProperty("skip");
    expect(ScenarioOutline.skip).toBeTypeOf("function");
    expect(ScenarioOutline).toHaveProperty("only");
    expect(ScenarioOutline.only).toBeTypeOf("function");
  });
});
