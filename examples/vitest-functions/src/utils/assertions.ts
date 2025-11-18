import { expect } from "vitest";

import type { HTTPResponse } from "@autometa/http";
import type { TableRecord } from "@autometa/gherkin";

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
  expect(response.status, "HTTP status mismatch").toBe(expected);
}

export function assertHeaderEquals(world: BrewBuddyWorld, header: string, expected: string): void {
  const response = requireResponse(world);
  const actual = response.headers?.[header.toLowerCase()] ?? response.headers?.[header];
  expect(actual, `Missing header ${header}`).toBeDefined();
  expect(String(actual)).toBe(expected);
}

export function assertHeaderStartsWith(world: BrewBuddyWorld, header: string, prefix: string): void {
  const response = requireResponse(world);
  const actual = response.headers?.[header.toLowerCase()] ?? response.headers?.[header];
  expect(actual, `Missing header ${header}`).toBeDefined();
  expect(String(actual).startsWith(prefix)).toBe(true);
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
  expect(Array.isArray(value), `Expected JSON array at path ${path}`).toBe(true);
  return value as unknown[];
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
  expect(found, `Menu item ${name} not found`).toBeDefined();
  return found ?? {};
}

export function assertTagRegistry(entries: TagRegistryEntry[] | undefined, expected: Array<Record<string, string>>): void {
  expect(entries, "Tag registry not initialised").toBeDefined();
  const actual = entries ?? [];
  expect(actual.length).toBe(expected.length);
  expected.forEach((row) => {
    const match = actual.find((entry) => entry.tag === row.tag);
    expect(match, `Missing tag ${row.tag}`).toBeDefined();
    expect(match?.description).toBe(row.description);
  });
}

function assertValueMatches(actual: unknown, expected: ExpectedValue, path: string): void {
  if (isTimestampPlaceholder(expected)) {
    expect(typeof actual).toBe("string");
    expect(String(actual).length).toBeGreaterThan(0);
    return;
  }

  expect(actual, `Value at path ${path} mismatch`).toEqual(expected);
}

function isTimestampPlaceholder(value: unknown): value is Placeholder {
  return Boolean(value && typeof value === "object" && (value as Placeholder).__placeholder === "timestamp");
}
