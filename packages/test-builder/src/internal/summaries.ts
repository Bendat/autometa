import type { ScenarioSummary } from "@autometa/scopes";
import { normalizeName } from "./utils";

export type ScenarioKindKey = "scenario" | "scenarioOutline";

export type ScenarioSummaryBuckets<World> = Map<string, ScenarioSummary<World>[]>;

export function bucketScenarioSummaries<World>(
  summaries: readonly ScenarioSummary<World>[]
): ScenarioSummaryBuckets<World> {
  const buckets: ScenarioSummaryBuckets<World> = new Map();

  for (const summary of summaries) {
    const key = createSummaryKey(
      summary.scenario.kind as ScenarioKindKey,
      summary.scenario.name,
      summary.rule?.id
    );
    const existing = buckets.get(key) ?? [];
    existing.push(summary);
    buckets.set(key, existing);
  }

  return buckets;
}

export function createSummaryKey(
  kind: ScenarioKindKey,
  scenarioName: string,
  parentScopeId: string | undefined
): string {
  return [
    kind,
    normalizeName(scenarioName),
    parentScopeId ?? "root",
  ].join("::");
}

export function describeSummary<World>(summary: ScenarioSummary<World>): string {
  const parts = [summary.scenario.name];
  if (summary.rule) {
    parts.push(`in rule '${summary.rule.name}'`);
  }
  return `${summary.scenario.kind} '${parts.join(" ")}'`;
}
