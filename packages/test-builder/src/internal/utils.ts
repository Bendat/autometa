import path from "node:path";
import type {
  SimpleCompiledScenario,
  SimpleExampleGroup,
  SimpleFeatureElement,
  SimpleRule,
  SimpleScenario,
  SimpleScenarioOutline,
  SimpleStep,
} from "@autometa/gherkin";
import type { QualifiedPathSegment } from "../types";

export function normalizeName(value: string): string {
  return value.trim();
}

export function normalizeKeyword(keyword: string): string {
  return keyword.trim();
}

export function normalizeUri(uri: string): string {
  const cleaned = uri.replace(/^file:/, "");
  const normalized = path.normalize(cleaned);
  // Ensure consistent posix-style separators regardless of host platform
  return normalized.replace(/[\\/]+/g, "/");
}

export function buildScopeSuffix(id: string): string {
  return ` [${id}]`;
}

export function buildExampleSuffix(exampleId: string, index: number): string {
  return ` [${exampleId}#${index + 1}]`;
}

export function buildQualifiedName(segments: readonly QualifiedPathSegment[]): string {
  return segments
    .map((segment) => {
      const keyword = segment.keyword.trim();
      const name = segment.name?.trim();
      const suffix = segment.suffix ?? "";
      if (!name || name.length === 0) {
        return `${keyword}${suffix}`;
      }
      return `${keyword}: ${name}${suffix}`;
    })
    .join(" > ");
}

export function collectTags(
  ...sources: ReadonlyArray<readonly string[] | undefined>
): readonly string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!source) {
      continue;
    }
    for (const tag of source) {
      if (!seen.has(tag)) {
        seen.add(tag);
        result.push(tag);
      }
    }
  }

  return result;
}

export function combineSteps(
  featureSteps: readonly SimpleStep[] | undefined,
  ruleSteps: readonly SimpleStep[] | undefined,
  scenarioSteps: readonly SimpleStep[] | undefined
): readonly SimpleStep[] {
  return [
    ...(featureSteps ?? []),
    ...(ruleSteps ?? []),
    ...(scenarioSteps ?? []),
  ];
}

export function cloneData(
  data: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!data) {
    return undefined;
  }
  return { ...data };
}

export function mergeData(
  base: Record<string, unknown> | undefined,
  extra: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!base && !extra) {
    return undefined;
  }
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
  };
}

export function createExampleData(
  group: SimpleExampleGroup,
  compiled: SimpleCompiledScenario
): Record<string, unknown> | undefined {
  const headers = group.tableHeader ?? [];
  const rows = group.tableBody ?? [];
  const row = rows[compiled.exampleIndex];
  if (!row) {
    return undefined;
  }
  const values: Record<string, string> = {};
  headers.forEach((header, index) => {
    const key = header.trim();
    if (key.length === 0) {
      return;
    }
    values[key] = row[index] ?? "";
  });
  return {
    example: {
      group: {
        id: group.id,
        name: group.name,
        tags: [...group.tags],
      },
      index: compiled.exampleIndex,
      values,
    },
  };
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  return new Error(JSON.stringify(error));
}

export function groupCompiledScenarios(
  compiled: readonly SimpleCompiledScenario[]
): Map<string, SimpleCompiledScenario[]> {
  const map = new Map<string, SimpleCompiledScenario[]>();
  for (const scenario of compiled ?? []) {
    const list = map.get(scenario.exampleGroupId) ?? [];
    list.push(scenario);
    map.set(scenario.exampleGroupId, list);
  }
  return map;
}

export function isRule(element: SimpleFeatureElement): element is SimpleRule {
  return "elements" in element && Array.isArray(element.elements);
}

export function isScenarioOutline(
  element: SimpleFeatureElement | SimpleScenario | SimpleScenarioOutline | SimpleRule
): element is SimpleScenarioOutline {
  return "exampleGroups" in element;
}

export function isScenario(
  element: SimpleFeatureElement | SimpleScenario
): element is SimpleScenario {
  return (
    "steps" in element &&
    !("exampleGroups" in element) &&
    !("elements" in element)
  );
}
