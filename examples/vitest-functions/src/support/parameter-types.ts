import type { ParameterTransformContext } from "@autometa/cucumber-expressions";

import { defineParameterType } from "../step-definitions";
import type { BrewBuddyWorld } from "../world";
import type { HttpMethod } from "../utils/http";
import {
  REGION_EXPECTATIONS,
  normalizeRegion,
  resolveExpectationByBeverage,
  type MenuExpectation,
  type MenuRegion,
} from "../utils/regions";

const HTTP_METHOD_VARIANTS = caseInsensitivePatterns(["GET", "POST", "PATCH", "DELETE", "PUT"]);
const REGION_VARIANTS = caseInsensitivePatterns(Object.keys(REGION_EXPECTATIONS));
const SELECTION_VARIANTS = caseInsensitivePatterns(
  Object.values(REGION_EXPECTATIONS).map((detail) => detail.expected)
);
const BOOLEAN_VARIANTS = caseInsensitivePatterns(["true", "false"]);

defineParameterType({
  name: "httpMethod",
  pattern: HTTP_METHOD_VARIANTS,
  transform: (method: unknown): HttpMethod => String(method).toUpperCase() as HttpMethod,
});

defineParameterType({
  name: "menuRegion",
  pattern: REGION_VARIANTS,
  transform: (value: unknown): MenuRegion => {
    const region = normalizeRegion(String(value));
    if (!region) {
      throw new Error(`Unknown Brew Buddy region: ${String(value)}`);
    }
    return region;
  },
});

defineParameterType({
  name: "menuSelection",
  pattern: SELECTION_VARIANTS,
  transform: (
    value: unknown,
    context: ParameterTransformContext<BrewBuddyWorld>
  ): MenuExpectation => {
    const expectation = resolveExpectationByBeverage(String(value));
    if (!expectation) {
      throw new Error(`No menu expectation registered for beverage ${String(value)}`);
    }

    const activeRegion = context.world.scenario.region;
    if (activeRegion && activeRegion !== expectation.region) {
      throw new Error(
        `Beverage ${expectation.beverage} is not available in the ${activeRegion} region`
      );
    }

    if (!context.world.scenario.region) {
      context.world.scenario.region = expectation.region;
    }

    return expectation;
  },
});

defineParameterType({
  name: "menuSeasonal",
  pattern: BOOLEAN_VARIANTS,
  transform: (value: unknown): boolean => /^true$/i.test(String(value)),
});

function caseInsensitivePatterns(values: Iterable<string>): readonly RegExp[] {
  const result: RegExp[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(new RegExp(`^${escapeRegExp(normalized)}$`, "i"));
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
