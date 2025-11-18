import type { HTTPResponse } from "@autometa/http";
import type { TableRecord } from "@autometa/gherkin";

import { inspect, isDeepStrictEqual } from "node:util";

import { resolveJsonPath, normalizeValue } from "./json";
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

export function assertStatus(world: BrewBuddyWorld, expected: number): void {
  const response = requireResponse(world);
  assertStrictEqual(response.status, expected, `Expected HTTP status ${expected} but received ${response.status}.`);
}

export function assertHeaderEquals(world: BrewBuddyWorld, header: string, expected: string): void {
  const response = requireResponse(world);
  const actual = response.headers?.[header.toLowerCase()] ?? response.headers?.[header];
  const resolved = assertDefined(actual, `Missing header ${header}`);
  assertStrictEqual(String(resolved), expected, `Expected header ${header} to equal ${expected} but received ${String(resolved)}.`);
}

export function assertHeaderStartsWith(world: BrewBuddyWorld, header: string, prefix: string): void {
  const response = requireResponse(world);
  const actual = response.headers?.[header.toLowerCase()] ?? response.headers?.[header];
  const resolved = assertDefined(actual, `Missing header ${header}`);
  assertTrue(String(resolved).startsWith(prefix), `Expected header ${header} to start with ${prefix} but received ${String(resolved)}.`);
}

export function assertJsonContains(world: BrewBuddyWorld, expectations: Iterable<PathExpectation>): void {
  const body = world.lastResponseBody;
  for (const { path, value } of expectations) {
    const actual = resolveJsonPath(body, path);
    assertValueMatches(actual, value, path);
  }
}

export function assertJsonArray(world: BrewBuddyWorld, path: string): unknown[] {
  const body = world.lastResponseBody;
  const value = resolveJsonPath(body, path);
  return assertArray(value, `Expected JSON array at path ${path}.`);
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

function assertValueMatches(actual: unknown, expected: ExpectedValue, path: string): void {
  if (isTimestampPlaceholder(expected)) {
    assertStrictEqual(typeof actual, "string", `Expected ${path} to be a timestamp string.`);
    assertGreaterThan(String(actual).length, 0, `Expected ${path} to contain a non-empty timestamp.`);
    return;
  }

  assertDeepEqual(actual, expected, `Value at path ${path} mismatch.`);
}

function isTimestampPlaceholder(value: unknown): value is Placeholder {
  return Boolean(value && typeof value === "object" && (value as Placeholder).__placeholder === "timestamp");
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

export function assertArray(value: unknown, message = "Expected value to be an array."): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
  return value;
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

function formatComparison(kind: string, actual: unknown, expected: unknown): string {
  return `Expected ${kind} between ${formatValue(actual)} and ${formatValue(expected)}.`;
}

function formatValue(value: unknown): string {
  return inspect(value, { depth: 4, maxArrayLength: 10 });
}
