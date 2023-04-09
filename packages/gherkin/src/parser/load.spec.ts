import { describe, it, expect } from "vitest";
import { Rule, ScenarioOutline } from "../groups";
import { Background, Scenario } from "../";
import { parseGherkin } from "./load";
describe("Gherkin Parser", () => {
  const gherkin = `@first
Feature: My feature
    Background: Outer background
      Given a step
          """
  a docstring
          """

    @second
    Scenario: Outer scenario
      Given a step
        | a  | b | c    |
        | hi | 2 | true |
  
    @groof
    Scenario Outline: Outer outline with <a> and <b>
      Given a step
      
      @goof
      Examples: an examples table
          | a | b |
          | 1 | 2 |

    @second
    Rule: My rule
      Background: Inner background
        Given a step

      @third
      Scenario: Inner scenario
        Given a step
  
      Scenario Outline: Inner outline
        Given a step
        Examples: an examples table
          | a | b |
          | 1 | 2 |
  `;
  const parsed = parseGherkin(gherkin, "/path");
  it("should parse a feature correctly", () => {
    const { name, children } = parsed;
    expect(name).toEqual("My feature");
    expect(children.length).toEqual(4);
  });
  it("should have a background as the first child", () => {
    const { children } = parsed;
    const [background] = children as [Background];
    expect(background.name).toEqual("Outer background");
    expect(background.steps.length).toEqual(1);
    expect(background.steps[0].text).toEqual("a step");
    expect(background.steps[0].hasDocstring).toEqual(true);
    expect(background.steps[0].docstring?.content).toEqual("a docstring");
    expect(background.steps[0].hasTable).toEqual(false);
  });
  it("should have a scenario as the second child", () => {
    const { children } = parsed;
    const [_, scenario] = children as [Background, Scenario];
    expect(scenario.name).toEqual("Outer scenario");
    expect([...scenario.tags]).toEqual(["@first", "@second"]);

    expect(scenario.steps.length).toEqual(1);
    expect(scenario.steps[0].hasDocstring).toEqual(false);
    expect(scenario.steps[0].hasTable).toEqual(true);
    expect(scenario.steps[0].table).toEqual([
      ["a", "b", "c"],
      ["hi", 2, true],
    ]);
  });
  it("should have a scenario outline as the third child", () => {
    const { children } = parsed;
    const [_, __, outline] = children as [unknown, unknown, ScenarioOutline];
    const { examples } = outline;
    const [example] = examples;
    expect(outline.name).toEqual("Outer outline with <a> and <b>");
    expect([...outline.tags]).toEqual(["@first", "@groof"]);
    expect(examples.length).toBe(1);
    expect(example.titles).toEqual(["a", "b"]);
    expect(example.values).toEqual([["1", "2"]]);
  });

  it("should have valid example scenarios for outline", () => {
    const { children } = parsed;
    const [_, __, outline] = children as [unknown, unknown, ScenarioOutline];
    const { examples } = outline;
    const [exampleA] = examples;
    const [scenario] = exampleA.children;
    expect([...outline.tags]).toEqual(["@first", "@groof"]);
    expect(exampleA.name).toEqual("an examples table");
    expect(examples.length).toBe(1);
    expect([...exampleA.tags]).toEqual(["@first", "@groof", "@goof"]);
    expect(exampleA.titles).toEqual(["a", "b"]);
    expect(exampleA.values).toEqual([["1", "2"]]);
    expect(exampleA.children.length).toEqual(1);
    expect(scenario.name).toEqual("Outer outline with <a> and <b>");
    expect(scenario.steps.length).toEqual(1);
  });
  describe("rule", () => {
    it("should have a background as the first child", () => {
      const { children } = parsed;
      const rule = children[3] as Rule;
      const background = rule.childer[0] as Background;
      expect(background.name).toEqual("Inner background");
      expect(background.steps.length).toEqual(1);
      expect(background.steps[0].text).toEqual("a step");
      expect(background.steps[0].hasDocstring).toEqual(false);
      expect(background.steps[0].hasTable).toEqual(false);
    });

    it("should have a scenario as the second child", () => {
      const { children } = parsed;
      const rule = children[3] as Rule;
      const scenario = rule.childer[1] as Scenario;
      expect(scenario.name).toEqual("Inner scenario");
      expect([...scenario.tags]).toEqual(["@first", "@second", "@third"]);
      expect(scenario.steps.length).toEqual(1);
      expect(scenario.steps[0].hasDocstring).toEqual(false);
      expect(scenario.steps[0].hasTable).toEqual(false);
    });

    it("should have a scenario outline as the third child", () => {
      const { children } = parsed;
      const rule = children[3] as Rule;
      const outline = rule.childer[2] as ScenarioOutline;
      const [example] = outline.examples;
      expect(outline.name).toEqual("Inner outline");
      expect([...outline.tags]).toEqual(["@first", "@second"]);
      expect(outline.examples.length).toBe(1);
      expect(example.titles).toEqual(["a", "b"]);
      expect(example.values).toEqual([["1", "2"]]);
    });
  });
});
