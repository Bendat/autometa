import type { HTTPResponse } from "@autometa/http";
import type { TableRecord } from "@autometa/gherkin";

import {
  fromHttpResponse,
  type AssertionPlugin,
  type EnsureChain,
  type EnsurePluginFacets,
  type HttpResponseLike,
  type HeaderExpectation,
  type CacheControlExpectation,
  type StatusExpectation,
} from "@autometa/assertions";

import { normalizeValue, resolveJsonPath } from "./json";
import type { BrewBuddyWorld } from "../world";

interface Placeholder {
  readonly __placeholder: "timestamp";
}

type ExpectedValue = unknown | Placeholder;

type PathExpectation = {
  readonly path: string;
  readonly value: ExpectedValue;
};

export function requireResponse(world: BrewBuddyWorld): HTTPResponse<unknown> {
  if (!world.app.lastResponse) {
    throw new Error("No HTTP response recorded for the current scenario.");
  }
  return world.app.lastResponse;
}

interface ResponseAssertions {
  readonly ensure: () => EnsureChain<HttpResponseLike>;
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
    const chain = (detail?: string): EnsureChain<HttpResponseLike> =>
      ensure(fromHttpResponse(requireResponse(world)), {
        label: detail ? `${label} (${detail})` : label,
      });

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
      ensure.always(world.app.lastResponseBody, { label: bodyLabel }).toBeDefined()
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

export const brewBuddyPlugins = {
  response: responsePlugin,
  json: jsonPlugin,
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
