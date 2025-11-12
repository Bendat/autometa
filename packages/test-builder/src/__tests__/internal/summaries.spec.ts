import { describe, expect, it } from "vitest";
import type {
  ScenarioSummary,
  ScopeNode,
  StepDefinition,
} from "../../../../scopes/src/types";
import {
  bucketScenarioSummaries,
  createSummaryKey,
  describeSummary,
} from "../../internal/summaries";

type World = Record<string, never>;

const createScope = (
  kind: ScopeNode<World>["kind"],
  id: string,
  name: string
): ScopeNode<World> => ({
  id,
  kind,
  name,
  mode: "default",
  tags: [],
  steps: [],
  hooks: [],
  children: [],
});

const createSummary = (options: {
  id: string;
  scenario: ScopeNode<World>;
  feature: ScopeNode<World>;
  rule?: ScopeNode<World>;
  steps?: readonly StepDefinition<World>[];
  ancestors?: readonly ScopeNode<World>[];
}): ScenarioSummary<World> => ({
  id: options.id,
  scenario: options.scenario,
  feature: options.feature,
  ...(options.rule ? { rule: options.rule } : {}),
  steps: options.steps ?? [],
  ancestors: options.ancestors ?? [],
});

describe("scenario summaries", () => {
  it("buckets summaries by scenario name and parent rule", () => {
    const feature = createScope("feature", "feature-1", "Feature");
    const retailRule = createScope("rule", "rule-retail", "retail");
    const wholesaleRule = createScope("rule", "rule-wholesale", "wholesale");
    const scenarioTemplate = createScope("scenario", "scenario-1", "Checkout");
    const outlineTemplate = createScope("scenarioOutline", "outline-1", "Checkout Outline");

    const summaries: ScenarioSummary<World>[] = [
      createSummary({
        id: "summary-1",
        scenario: scenarioTemplate,
        feature,
        rule: retailRule,
      }),
      createSummary({
        id: "summary-2",
        scenario: { ...scenarioTemplate, id: "scenario-2" },
        feature,
        rule: wholesaleRule,
      }),
      createSummary({
        id: "summary-3",
        scenario: outlineTemplate,
        feature,
      }),
      createSummary({
        id: "summary-4",
        scenario: { ...outlineTemplate, id: "outline-2", name: "Checkout Outline" },
        feature,
      }),
    ];

    const buckets = bucketScenarioSummaries(summaries);
    const retailKey = createSummaryKey("scenario", "Checkout", retailRule.id);
    const wholesaleKey = createSummaryKey("scenario", "Checkout", wholesaleRule.id);
    const outlineKey = createSummaryKey("scenarioOutline", "Checkout Outline", undefined);

    expect(buckets.get(retailKey)?.map((summary) => summary.id)).toEqual(["summary-1"]);
    expect(buckets.get(wholesaleKey)?.map((summary) => summary.id)).toEqual(["summary-2"]);
    expect(buckets.get(outlineKey)?.map((summary) => summary.id)).toEqual(["summary-3", "summary-4"]);
  });

  it("describes summaries including rule ancestry when present", () => {
    const feature = createScope("feature", "feature", "Feature");
    const rule = createScope("rule", "rule", "Pricing");
    const scenario = createScope("scenario", "scenario", "Calculate totals");
    const outline = createScope("scenarioOutline", "outline", "Apply discounts");

    const scenarioSummary = createSummary({ id: "scenario", scenario, feature, rule });
    const outlineSummary = createSummary({ id: "outline", scenario: outline, feature });

    expect(describeSummary(scenarioSummary)).toBe("scenario 'Calculate totals in rule 'Pricing''");
    expect(describeSummary(outlineSummary)).toBe("scenarioOutline 'Apply discounts'");
  });
});
