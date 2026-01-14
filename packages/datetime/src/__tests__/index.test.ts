import { describe, expect, it } from "vitest";
import {
  Dates,
  Time,
  TimeDiff,
  createDates,
  createTime,
} from "../index.js";
import type { Clock } from "../dates/clock.js";

class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return new Date(this.fixed.getTime());
  }
}

describe("package exports", () => {
  it("creates date facades from the entry point", () => {
    const base = new Date("2024-01-01T00:00:00.000Z");
    const dates = createDates({ clock: new FixedClock(base) });
    expect(dates.today.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(dates.iso.tomorrow).toBe("2024-01-02T00:00:00.000Z");
  });

  it("exposes eager singletons", () => {
    expect(Dates).toBeDefined();
    expect(Time).toBeDefined();
    expect(new TimeDiff().seconds(new Date(0), new Date(1000))).toBe(1);
  });

  it("provides diff helpers through factory", () => {
    const time = createTime();
    const diff = time.diff.fromPhrase("minutes");
    const start = new Date("2024-02-01T00:00:00.000Z");
    const end = new Date("2024-02-01T00:05:00.000Z");
    expect(diff(start, end)).toBe(5);
  });
});
