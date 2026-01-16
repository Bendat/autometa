import { describe, it, expect } from "vitest";
import { formatFeatureFile } from "./formatter";

describe("formatFeatureFile", () => {
  it("formats a feature file with consistent indentation", () => {
    const input = `Feature: Hello
Scenario: one
Given hello
`;
    const result = formatFeatureFile(input);
    expect(result).toBe(`Feature: Hello

  Scenario: one
    Given hello
`);
  });

  it("aligns data table columns", () => {
    const input = `Feature: Tables
  Scenario: aligned
    Given a table:
      | a | bb | ccc |
      | longer | x | y |
`;
    const result = formatFeatureFile(input);
    // The pretty printer aligns columns to the longest value
    expect(result).toContain("| a      | bb | ccc |");
    expect(result).toContain("| longer | x  | y   |");
  });

  it("returns original text when parsing fails", () => {
    const invalidGherkin = `This is not valid gherkin
Just some random text`;
    const result = formatFeatureFile(invalidGherkin);
    expect(result).toBe(invalidGherkin);
  });

  it("preserves tags", () => {
    const input = `@feature-tag
Feature: Tagged Feature

  @scenario-tag @another-tag
  Scenario: Tagged Scenario
    Given a step
`;
    const result = formatFeatureFile(input);
    expect(result).toContain("@feature-tag");
    expect(result).toContain("@scenario-tag @another-tag");
  });

  it("formats scenario outlines with examples", () => {
    const input = `Feature: Outlines
  Scenario Outline: templated
    Given I have <count> items
    Examples:
      | count |
      | 1 |
      | 10 |
      | 100 |
`;
    const result = formatFeatureFile(input);
    // Should have proper indentation
    expect(result).toContain("  Scenario Outline: templated");
    expect(result).toContain("    Given I have <count> items");
    expect(result).toContain("    Examples:");
    // Columns should be aligned (numbers are right-aligned by pretty printer)
    expect(result).toContain("| count |");
    expect(result).toContain("|     1 |");
    expect(result).toContain("|    10 |");
    expect(result).toContain("|   100 |");
  });
});
