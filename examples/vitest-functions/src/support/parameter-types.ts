import type { ParameterTransformContext } from "@autometa/cucumber-expressions";

import type { BrewBuddyWorld } from "../world";
import type { HttpMethod } from "../utils/http";
import {
  REGION_EXPECTATIONS,
  normalizeRegion,
  resolveExpectationByBeverage,
  type MenuExpectation,
  type MenuRegion,
} from "../utils/regions";

type DefineParameterTypeFn = (definition: {
  name: string;
  pattern: RegExp;
  transform: (value: unknown, context: ParameterTransformContext<BrewBuddyWorld>) => unknown;
}) => void;

/**
 * Registers all custom parameter types for cucumber expressions.
 * This function must be called after the steps environment is created.
 */
export function registerParameterTypes(defineParameterType: DefineParameterTypeFn): void {
  const HTTP_METHOD_VARIANTS = caseInsensitivePattern(["GET", "POST", "PATCH", "DELETE", "PUT"]);
  const REGION_VARIANTS = caseInsensitivePattern(Object.keys(REGION_EXPECTATIONS));
  const SELECTION_VARIANTS = caseInsensitivePattern(
    Object.values(REGION_EXPECTATIONS).map((detail) => detail.expected)
  );
  const BOOLEAN_VARIANTS = caseInsensitivePattern(["true", "false"]);

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
}

function caseInsensitivePattern(values: Iterable<string>): RegExp {
  const bodies: string[] = [];
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
    bodies.push(createCaseInsensitiveBody(normalized));
  }
  // Create single RegExp with alternation - no anchors or capturing groups
  return new RegExp(bodies.join("|"));
}

function createCaseInsensitiveBody(value: string): string {
  let pattern = "";
  for (const char of value) {
    pattern += createCaseInsensitiveFragment(char);
  }
  return pattern;
}

function createCaseInsensitiveFragment(char: string): string {
  const lower = char.toLowerCase();
  const upper = char.toUpperCase();
  if (lower === upper) {
    return escapeRegExpChar(char);
  }
  return `[${escapeRegExpChar(lower)}${escapeRegExpChar(upper)}]`;
}

function escapeRegExpChar(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
