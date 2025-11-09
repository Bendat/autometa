import { describe, expect, it } from "vitest";
import { DateFactory } from "../dates/date-factory.js";
import type { Clock } from "../dates/clock.js";

class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return new Date(this.fixed.getTime());
  }
}

const BASE = new Date("2024-01-15T15:30:00.000Z");

function createFactory(base: Date = BASE): DateFactory {
  return new DateFactory({ clock: new FixedClock(base) });
}

describe("DateFactory", () => {
  it("produces deterministic dates for shortcuts", () => {
    const factory = createFactory();

    expect(factory.find("today").toISOString()).toBe("2024-01-15T15:30:00.000Z");
    expect(factory.find("yesterday").toISOString()).toBe("2024-01-14T15:30:00.000Z");
    expect(factory.find("tomorrow").toISOString()).toBe("2024-01-16T15:30:00.000Z");
    expect(factory.find("midnight").toISOString()).toBe("2024-01-16T00:00:00.000Z");
    expect(factory.find("nextWeek").toISOString()).toBe("2024-01-22T15:30:00.000Z");
    expect(factory.find("lastFortnight").toISOString()).toBe("2024-01-01T15:30:00.000Z");
  });

  it("parses natural phrases", () => {
    const factory = createFactory();
    expect(factory.fromPhrase("before yesterday").toISOString()).toBe(
      "2024-01-13T15:30:00.000Z"
    );
    expect(factory.fromPhrase("1 day from now").toISOString()).toBe(
      "2024-01-16T15:30:00.000Z"
    );
    expect(factory.fromPhrase("2 weeks ago").toISOString()).toBe(
      "2024-01-01T15:30:00.000Z"
    );
  });

  it("parses ISO strings and native date formats", () => {
    const factory = createFactory();
    expect(factory.fromPhrase("2020-05-01T12:00:00.000Z").toISOString()).toBe(
      "2020-05-01T12:00:00.000Z"
    );
    expect(factory.fromPhrase("May 1, 2020 12:00:00").toISOString()).toBe(
      new Date("May 1, 2020 12:00:00").toISOString()
    );
  });

  it("returns invalid date for unknown phrases with fromPhraseSafe", () => {
    const factory = createFactory();
    const result = factory.fromPhraseSafe("not a date");
    expect(Number.isNaN(result.getTime())).toBe(true);
  });

  it("throws for unknown phrases with fromPhrase", () => {
    const factory = createFactory();
    expect(() => factory.fromPhrase("unknown phrase")).toThrowError(
      /Could not parse date/
    );
  });

  it("supports explicit offsets via make", () => {
    const factory = createFactory();
    expect(factory.make(90, "minutes").toISOString()).toBe(
      "2024-01-15T17:00:00.000Z"
    );
    expect(factory.make(-2, "hours").toISOString()).toBe(
      "2024-01-15T13:30:00.000Z"
    );
    expect(factory.make(1, "fortnight").toISOString()).toBe(
      "2024-01-29T15:30:00.000Z"
    );
    expect(factory.make(1, "months").toISOString()).toBe(
      "2024-02-15T15:30:00.000Z"
    );
    expect(factory.make(1, "years").toISOString()).toBe(
      "2025-01-15T15:30:00.000Z"
    );
    expect(factory.make(30, "seconds").toISOString()).toBe(
      "2024-01-15T15:30:30.000Z"
    );
    expect(factory.make(500, "ms").toISOString()).toBe(
      "2024-01-15T15:30:00.500Z"
    );
  });

  it("rejects invalid offsets and units", () => {
    const factory = createFactory();
    expect(() => factory.make(Number.NaN, "days")).toThrow(/Time offset/);
    expect(() => factory.make(1, "centuries")).toThrow(/Unsupported time unit/);
  });

  it("falls back to the system clock when no clock is provided", () => {
    const factory = new DateFactory();
    const before = Date.now();
    const result = factory.find("today");
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before - 50);
    expect(result.getTime()).toBeLessThanOrEqual(after + 50);
  });
});
