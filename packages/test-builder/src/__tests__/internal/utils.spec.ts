import { describe, expect, it } from "vitest";
import type { SimpleCompiledScenario, SimpleStep } from "../../../../gherkin/src";
import {
  buildExampleSuffix,
  buildQualifiedName,
  buildScopeSuffix,
  cloneData,
  collectTags,
  combineSteps,
  createExampleData,
  groupCompiledScenarios,
  mergeData,
  normalizeError,
  normalizeKeyword,
  normalizeName,
  normalizeUri,
} from "../../internal/utils";

const step = (id: string, text: string): SimpleStep => ({
  id,
  keyword: "Given",
  text,
  location: { line: 1, column: 1 },
});

describe("internal utils", () => {
  it("normalizes names, keywords, and paths", () => {
    expect(normalizeName("  Login ")).toBe("Login");
    expect(normalizeKeyword(" Scenario ")).toBe("Scenario");
    expect(normalizeUri("file:features/nested/example.feature")).toBe(
      "features/nested/example.feature"
    );
    expect(normalizeUri("features\\nested\\example.feature")).toBe(
      "features/nested/example.feature"
    );
  });

  it("builds scope and example suffixes along qualified names", () => {
    const qualified = buildQualifiedName([
      { keyword: "Feature", name: "A", suffix: buildScopeSuffix("f-1") },
      { keyword: "Scenario", name: "B", suffix: buildScopeSuffix("s-1") },
      { keyword: "Example", name: "#1", suffix: buildExampleSuffix("e-1", 0) },
    ]);

    expect(qualified).toBe("Feature: A [f-1] > Scenario: B [s-1] > Example: #1 [e-1#1]");
  });

  it("collects tags without duplicates while preserving order", () => {
    const result = collectTags(["@feature", "@common"], undefined, ["@common", "@scenario"]);
    expect(result).toEqual(["@feature", "@common", "@scenario"]);
  });

  it("combines steps in feature, rule, scenario order", () => {
    const combined = combineSteps([step("f", "feature")], [step("r", "rule")], [step("s", "scenario")]);
    expect(combined.map((s) => s.id)).toEqual(["f", "r", "s"]);
  });

  it("clones and merges execution data safely", () => {
    const base = { foo: "bar" } as const;
    const cloned = cloneData(base);
    expect(cloned).toEqual(base);
    expect(cloned).not.toBe(base);

    expect(cloneData(undefined)).toBeUndefined();
    expect(mergeData(undefined, undefined)).toBeUndefined();
    expect(mergeData({ feature: true }, { scenario: "value" })).toEqual({
      feature: true,
      scenario: "value",
    });
  });

  it("creates example datasets from compiled scenarios", () => {
    const compiled: SimpleCompiledScenario = {
      id: "c-1",
      keyword: "Scenario",
      name: "outline (value)",
      description: "",
      tags: [],
      steps: [],
      exampleIndex: 1,
      exampleGroupId: "g-1",
      scenarioOutlineId: "outline-1",
    };

    const group = {
      id: "g-1",
      keyword: "Examples",
      name: "dataset",
      description: "",
      tags: ["@examples"],
      tableHeader: ["value"],
      tableBody: [["first"], ["second"], ["third"]],
      location: { line: 1, column: 1 },
    };

    const exampleData = createExampleData(group, compiled);
    expect(exampleData).toEqual({
      example: {
        group: {
          id: "g-1",
          name: "dataset",
          tags: ["@examples"],
        },
        index: 1,
        values: { value: "second" },
      },
    });
  });

  it("normalizes thrown values to Error instances", () => {
    const asError = normalizeError(new Error("boom"));
    const fromString = normalizeError("boom");
    const fromObject = normalizeError({ message: "boom" });

    expect(asError.message).toBe("boom");
    expect(fromString.message).toBe("boom");
    expect(() => JSON.parse(fromObject.message)).not.toThrow();
  });

  it("groups compiled scenarios by example group id", () => {
    const scenarios: SimpleCompiledScenario[] = [
      {
        id: "c-1",
        keyword: "Scenario",
        name: "case A",
        description: "",
        tags: [],
        steps: [],
        exampleIndex: 0,
        exampleGroupId: "g-1",
        scenarioOutlineId: "outline-1",
      },
      {
        id: "c-2",
        keyword: "Scenario",
        name: "case B",
        description: "",
        tags: [],
        steps: [],
        exampleIndex: 1,
        exampleGroupId: "g-1",
        scenarioOutlineId: "outline-1",
      },
      {
        id: "c-3",
        keyword: "Scenario",
        name: "case C",
        description: "",
        tags: [],
        steps: [],
        exampleIndex: 0,
        exampleGroupId: "g-2",
        scenarioOutlineId: "outline-2",
      },
    ];

    const grouped = groupCompiledScenarios(scenarios);
    expect(Array.from(grouped.get("g-1") ?? []).map(({ id }) => id)).toEqual(["c-1", "c-2"]);
    expect(Array.from(grouped.get("g-2") ?? []).map(({ id }) => id)).toEqual(["c-3"]);
  });
});
