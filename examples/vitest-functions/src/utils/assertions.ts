import type { HTTPResponse } from "@autometa/http";
import type { TableRecord } from "@autometa/gherkin";

import {
  createEnsureFactory,
  fromHttpResponse,
  type AssertionPlugin,
  type EnsureChain,
  type EnsureFacade,
  type EnsureFactory,
  type EnsureInvoke,
  type EnsurePluginFacets,
  type HttpResponseLike,
  type HeaderExpectation,
  type CacheControlExpectation,
  type StatusExpectation,
} from "@autometa/assertions";
import { inspect, isDeepStrictEqual } from "node:util";

import { normalizeValue, resolveJsonPath } from "./json";
import type { BrewBuddyWorld, TagRegistryEntry } from "../world";

interface Placeholder {
  readonly __placeholder: "timestamp";
}

type ExpectedValue = unknown | Placeholder;

type PathExpectation = {
  readonly path: string;
  readonly value: ExpectedValue;
};

export function requireResponse(world: BrewBuddyWorld): HTTPResponse<unknown> {
  if (!world.lastResponse) {
    throw new Error("No HTTP response recorded for the current scenario.");
  }
  return world.lastResponse;
}

interface ResponseAssertions {
  readonly ensure: () => EnsureChain<HttpResponseLike>;
  hasStatus(expectation: StatusExpectation): void;
  hasHeader(name: string, expectation?: HeaderExpectation): void;
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
    const chain = (): EnsureChain<HttpResponseLike> =>
      ensure(fromHttpResponse(requireResponse(world)), { label });

    return {
      ensure: chain,
      hasStatus(expectation: StatusExpectation) {
        chain().toHaveStatus(expectation);
      },
      hasHeader(name: string, expectation?: HeaderExpectation) {
        chain().toHaveHeader(name, expectation);
      },
      isCacheable(expectation?: CacheControlExpectation) {
        chain().toBeCacheable(expectation);
      },
      hasCorrelationId(headerName?: string) {
        chain().toHaveCorrelationId(headerName);
      },
    };
  };

const jsonPlugin: AssertionPlugin<BrewBuddyWorld, JsonAssertions> = ({ ensure }) =>
  (world) => {
    const bodyLabel = "response json";
    const ensureBody = () =>
      ensure(world.lastResponseBody, { label: bodyLabel }).toBeDefined().value;

    return {
      contains(expectations: Iterable<PathExpectation>) {
        const body = ensureBody();
        for (const { path, value } of expectations) {
          const label = `json path ${path}`;
          const resolved = resolveJsonPath(body, path);
          const actual = ensure(resolved, { label }).value;

          if (isTimestampPlaceholder(value)) {
            assertStrictEqual(typeof actual, "string", `Expected ${path} to be a timestamp string.`);
            assertGreaterThan(String(actual).length, 0, `Expected ${path} to contain a non-empty timestamp.`);
            continue;
          }

          assertDeepEqual(actual, value, `Value at path ${path} mismatch.`);
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

const brewBuddyPlugins = {
  response: responsePlugin,
  json: jsonPlugin,
} as const;

export type BrewBuddyEnsureFacets = EnsurePluginFacets<
  BrewBuddyWorld,
  typeof brewBuddyPlugins
>;

export type BrewBuddyEnsure = EnsureFacade<BrewBuddyWorld, BrewBuddyEnsureFacets>;

export type BrewBuddyEnsureFactory = EnsureFactory<
  BrewBuddyWorld,
  BrewBuddyEnsureFacets
>;

export function createBrewBuddyEnsureFactory(ensureInvoke: EnsureInvoke): BrewBuddyEnsureFactory {
  return createEnsureFactory<BrewBuddyWorld, typeof brewBuddyPlugins>(
    ensureInvoke,
    brewBuddyPlugins
  );
}

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

export function assertMenuHasItem(menu: Array<Record<string, unknown>>, name: string): Record<string, unknown> {
  const found = menu.find((item) => String(item.name).toLowerCase() === name.toLowerCase());
  return assertDefined(found, `Menu item ${name} not found`);
}

export function assertTagRegistry(entries: TagRegistryEntry[] | undefined, expected: Array<Record<string, string>>): void {
  const actual = assertDefined(entries, "Tag registry not initialised");
  assertLength(actual, expected.length, `Expected ${expected.length} tag entries but found ${actual.length}.`);
  expected.forEach((row) => {
    const match = actual.find((entry) => entry.tag === row.tag);
    const resolved = assertDefined(match, `Missing tag ${row.tag}`);
    assertStrictEqual(resolved.description, row.description, `Description for tag ${row.tag} did not match.`);
  });
}

export function assertDefined<T>(value: T | null | undefined, message = "Expected value to be defined."): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}

export function assertStrictEqual<T>(actual: T, expected: T, message?: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(message ?? formatComparison("strict equality", actual, expected));
  }
}

export function assertTrue(condition: unknown, message = "Expected condition to be truthy."): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertFalse(condition: unknown, message = "Expected condition to be falsy."): void {
  if (condition) {
    throw new Error(message);
  }
}

export function assertLength(value: { length: number }, expected: number, message?: string): void {
  if (value.length !== expected) {
    throw new Error(message ?? `Expected length ${expected} but received ${value.length}.`);
  }
}

export function assertGreaterThan(value: number, threshold: number, message?: string): void {
  if (!(value > threshold)) {
    throw new Error(message ?? `Expected ${value} to be greater than ${threshold}.`);
  }
}

export function assertCloseTo(actual: number, expected: number, precision = 2, message?: string): void {
  const tolerance = Math.pow(10, -precision) / 2;
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    throw new Error(message ?? `Expected finite numbers for comparison but received ${formatValue(actual)} and ${formatValue(expected)}.`);
  }
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      message ?? `Expected ${formatValue(actual)} to be within ${tolerance} of ${formatValue(expected)}.`
    );
  }
}

export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(message ?? formatComparison("deep equality", actual, expected));
  }
}

function isTimestampPlaceholder(value: unknown): value is Placeholder {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Partial<Placeholder>).__placeholder === "timestamp"
  );
}

function formatComparison(kind: string, actual: unknown, expected: unknown): string {
  return `Expected ${kind} between ${formatValue(actual)} and ${formatValue(expected)}.`;
}

function formatValue(value: unknown): string {
  return inspect(value, { depth: 4, maxArrayLength: 10 });
}
