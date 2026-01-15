import type {
  ParameterTypeDefinition,
  ParameterTransformContext,
} from "@autometa/cucumber-expressions";

// Note: this example previously imported these types via `@autometa/core/cucumber`.
// Importing directly keeps the example decoupled from `@autometa/core`'s subpath
// export surface.

import type { BrewBuddyWorld } from "../world";
import type { HttpMethod } from "../brew-buddy/domain/clients/client";
import {
  REGION_EXPECTATIONS,
  normalizeRegion,
  resolveExpectationByBeverage,
  type MenuExpectation,
  type MenuRegion,
} from "../utils/regions";

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

const HTTP_METHOD_VARIANTS = caseInsensitivePattern([
  "GET",
  "POST",
  "PATCH",
  "DELETE",
  "PUT",
]);
const REGION_VARIANTS = caseInsensitivePattern(Object.keys(REGION_EXPECTATIONS));
const SELECTION_VARIANTS = caseInsensitivePattern(
  (Object.values(REGION_EXPECTATIONS) as Array<{ expected: string }>).map(
    (detail) => detail.expected
  )
);
const BOOLEAN_VARIANTS = caseInsensitivePattern(["true", "false"]);

/**
 * Custom parameter types for cucumber expressions.
 *
 * This module lives under `src/autometa/*` so projects have a conventional place
 * for Autometa configuration.
 */
export const brewBuddyParameterTypes: ParameterTypeDefinition<BrewBuddyWorld>[] = [
  {
    name: "httpMethod",
    pattern: HTTP_METHOD_VARIANTS,
    transform: (method: unknown): HttpMethod =>
      String(method).toUpperCase() as HttpMethod,
  },
  {
    name: "menuRegion",
    pattern: REGION_VARIANTS,
    transform: (value: unknown): MenuRegion => {
      const region = normalizeRegion(String(value));
      if (!region) {
        throw new Error(`Unknown Brew Buddy region: ${String(value)}`);
      }
      return region;
    },
  },
  {
    name: "menuSelection",
    pattern: SELECTION_VARIANTS,
    transform: (
      value: unknown,
      context: ParameterTransformContext<BrewBuddyWorld>
    ): MenuExpectation => {
      const expectation = resolveExpectationByBeverage(String(value));
      if (!expectation) {
        throw new Error(
          `No menu expectation registered for beverage ${String(value)}`
        );
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
  },
  {
    name: "menuSeasonal",
    pattern: BOOLEAN_VARIANTS,
    transform: (value: unknown): boolean => /^true$/i.test(String(value)),
  },
];
