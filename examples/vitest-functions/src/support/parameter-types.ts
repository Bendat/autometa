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

const REGION_PATTERN = new RegExp(
  (Object.keys(REGION_EXPECTATIONS) as readonly string[])
    .map((region) => escapeRegExp(region))
    .join("|"),
  "i"
);

const SELECTION_PATTERN = new RegExp(
  Object.values(REGION_EXPECTATIONS)
    .map((detail) => escapeRegExp(detail.expected))
    .join("|"),
  "i"
);

defineParameterType({
  name: "httpMethod",
  pattern: /GET|POST|PATCH|DELETE|PUT/i,
  transform: (method: unknown): HttpMethod => String(method).toUpperCase() as HttpMethod,
});

defineParameterType({
  name: "menuRegion",
  pattern: REGION_PATTERN,
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
  pattern: SELECTION_PATTERN,
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
  pattern: /true|false/i,
  transform: (value: unknown): boolean => /^true$/i.test(String(value)),
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
