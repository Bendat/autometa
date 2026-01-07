import type { HTTPResponse } from "@autometa/http";
import {
  ensureHttp,
  type HttpEnsureChain,
  type HttpResponseLike,
  type HeaderExpectation,
  type CacheControlExpectation,
  type StatusExpectation,
} from "@autometa/http";
import type { TableRecord } from "@autometa/gherkin";

import {
  type AssertionPlugin,
  type EnsurePluginFacets,
} from "@autometa/assertions";

import { normalizeValue, resolveJsonPath } from "../../utils/json";
import type { BrewBuddyWorld } from "../../world";
import { toRecipeSlug, type RecipeList, type RecipeSummary } from "../api/recipe-client";

interface Placeholder {
  readonly __placeholder: "timestamp";
}

type ExpectedValue = unknown | Placeholder;

type PathExpectation = {
  readonly path: string;
  readonly value: ExpectedValue;
};

export function requireResponse(world: BrewBuddyWorld): HTTPResponse<unknown> {
  if (!world.app.history.lastResponse) {
    throw new Error("No HTTP response recorded for the current scenario.");
  }
  return world.app.history.lastResponse;
}

interface ResponseAssertions {
  readonly ensure: () => HttpEnsureChain<HttpResponseLike>;
  hasStatus(expectation: StatusExpectation): void;
  hasStatusNot(expectation: StatusExpectation): void;
  hasHeader(name: string, expectation?: HeaderExpectation): void;
  hasHeaderNot(name: string, expectation?: HeaderExpectation): void;
  isCacheable(expectation?: CacheControlExpectation): void;
  hasCorrelationId(headerName?: string): void;
}

interface JsonAssertions {
  contains(expectations: Iterable<PathExpectation>): void;
  array(path: string): unknown[];
}

const responsePlugin: AssertionPlugin<BrewBuddyWorld, ResponseAssertions> = ({ ensure }) =>
  (world) => {
    const label = "http response";
    const isNegated = ensure !== ensure.always;
    const chain = (detail?: string): HttpEnsureChain<HttpResponseLike> => {
      const response = requireResponse(world);
      return ensureHttp(response, {
        label: detail ? `${label} (${detail})` : label,
        negated: isNegated,
      });
    };

    return {
      ensure: chain,
      hasStatus(expectation: StatusExpectation) {
        chain(`status ${expectation}`).toHaveStatus(expectation);
      },
      hasStatusNot(expectation: StatusExpectation) {
        chain(`status not ${expectation}`).not.toHaveStatus(expectation);
      },
      hasHeader(name: string, expectation?: HeaderExpectation) {
        chain(`header ${name}`).toHaveHeader(name, expectation);
      },
      hasHeaderNot(name: string, expectation?: HeaderExpectation) {
        chain(`header ${name} not`).not.toHaveHeader(name, expectation);
      },
      isCacheable(expectation?: CacheControlExpectation) {
        chain("cacheability").toBeCacheable(expectation);
      },
      hasCorrelationId(headerName?: string) {
        chain(`correlation id${headerName ? ` (${headerName})` : ""}`).toHaveCorrelationId(headerName);
      },
    };
  };

const jsonPlugin: AssertionPlugin<BrewBuddyWorld, JsonAssertions> = ({ ensure }) =>
  (world) => {
    const bodyLabel = "response json";
    const ensureBody = () =>
      // IMPORTANT: Plugin-level negation (`ensure.not.json.*`) should invert the
      // assertions, not the preconditions needed to evaluate them.
      ensure.always(world.app.history.lastResponseBody, { label: bodyLabel }).toBeDefined()
        .value;

    return {
      contains(expectations: Iterable<PathExpectation>) {
        const body = ensureBody();
        for (const { path, value } of expectations) {
          const label = `json path ${path}`;
          const resolved = resolveJsonPath(body, path);
          const actual = ensure(resolved, { label }).value;

          if (isTimestampPlaceholder(value)) {
            ensure(typeof actual, { label: `Expected ${path} to be a timestamp string.` }).toStrictEqual("string");
            ensure(String(actual).length > 0, { label: `Expected ${path} to contain a non-empty timestamp.` }).toBeTruthy();
            continue;
          }

          ensure(actual, { label: `Value at path ${path} mismatch.` }).toEqual(value);
        }
      },
      array(path: string) {
        const body = ensureBody();
        const label = `json path ${path}`;
        const resolved = resolveJsonPath(body, path);
        return ensure(resolved, { label }).toBeInstanceOf(Array).value as unknown[];
      },
    };
  };

interface RecipeAssertions {
  isRecipeList(value: unknown): asserts value is RecipeList;
  list(): RecipeSummary[];
  doesNotContain(name: string): void;
}

const recipesPlugin: AssertionPlugin<BrewBuddyWorld, RecipeAssertions> = ({ ensure }) =>
  (world) => {
    const isRecipeList = (value: unknown): value is RecipeList => {
      if (!value || typeof value !== "object") {
        return false;
      }
      const dict = value as { recipes?: unknown };
      if (!Array.isArray(dict.recipes)) {
        return false;
      }
      return dict.recipes.every((item) => {
        if (!item || typeof item !== "object") {
          return false;
        }
        const recipe = item as Record<string, unknown>;
        return typeof recipe.name === "string";
      });
    };

    const requireList = (): RecipeSummary[] => {
      const body = world.app.history.lastResponseBody;
      ensure(isRecipeList(body), { label: "response body is recipe list" }).toBeTruthy();
      return (body as RecipeList).recipes;
    };

    return {
      isRecipeList(value: unknown): asserts value is RecipeList {
        ensure(isRecipeList(value), { label: "response body is recipe list" }).toBeTruthy();
      },
      list() {
        return requireList();
      },
      doesNotContain(name: string) {
        const recipes = requireList();
        const expectedSlug = world.app.memory.resolveRecipeSlug(name);
        const normalizedName = name.trim().toLowerCase();
        const normalizedSlug = expectedSlug.trim().toLowerCase();

        const isPresent = recipes.some((recipe) => {
          const recipeName = String(recipe.name ?? "");
          const recipeSlug = String(recipe.slug ?? toRecipeSlug(recipeName));
          return (
            recipeName.trim().toLowerCase() === normalizedName ||
            recipeSlug.trim().toLowerCase() === normalizedSlug
          );
        });

        ensure(isPresent, { label: `recipe ${name} present in list` }).toBeFalsy();
      },
    };
  };

export const brewBuddyPlugins = {
  response: responsePlugin,
  json: jsonPlugin,
  recipes: recipesPlugin,
} as const;

export type BrewBuddyEnsureFacets = EnsurePluginFacets<
  BrewBuddyWorld,
  typeof brewBuddyPlugins
>;

export function toPathExpectations(records: TableRecord[]): PathExpectation[] {
  return records.map((record) => {
    const rawPath = record.path;
    if (rawPath === undefined || rawPath === null) {
      throw new Error('Expectation table row is missing a "path" column');
    }
    const path = String(rawPath);
    if (!path.trim()) {
      throw new Error('Expectation table row contains an empty "path" value');
    }
    return {
      path,
      value: normalizeValue(record.value),
    };
  });
}

function isTimestampPlaceholder(value: unknown): value is Placeholder {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Partial<Placeholder>).__placeholder === "timestamp"
  );
}
