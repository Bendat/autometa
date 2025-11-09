import { describe, expect, it } from "vitest";
import { createDates } from "../dates/object.js";
import type { Clock } from "../dates/clock.js";

class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return new Date(this.fixed.getTime());
  }
}

describe("Dates facade", () => {
  const base = new Date("2024-03-10T08:15:00.000Z");
  const dates = createDates({ clock: new FixedClock(base) });

  it("exposes classic shortcuts", () => {
    expect(dates.today.toISOString()).toBe("2024-03-10T08:15:00.000Z");
    expect(dates.tomorrow.toISOString()).toBe("2024-03-11T08:15:00.000Z");
    expect(dates.lastWeek.toISOString()).toBe("2024-03-03T08:15:00.000Z");
    expect(dates.iso.nextFortnight).toBe("2024-03-24T08:15:00.000Z");
    expect(dates.fmt.yesterday).toBe("2024-03-09");
  });

  it("provides shortcut parity across adapters", () => {
    const iso = dates.iso;
    const fmt = dates.fmt;

    expect(dates.now.toISOString()).toBe("2024-03-10T08:15:00.000Z");
    expect(dates.beforeYesterday.toISOString()).toBe(
      dates.make(-2, "days").toISOString()
    );
    expect(dates.yesterday.toISOString()).toBe(
      dates.make(-1, "days").toISOString()
    );
    expect(dates.afterTomorrow.toISOString()).toBe(
      dates.make(2, "days").toISOString()
    );
    expect(dates.midnight.toISOString()).toBe(
      new Date(iso.midnight).toISOString()
    );
    expect(dates.nextWeek.toISOString()).toBe(
      dates.make(1, "weeks").toISOString()
    );
    expect(dates.lastFortnight.toISOString()).toBe(
      dates.make(-14, "days").toISOString()
    );
    expect(dates.nextFortnight.toISOString()).toBe(
      dates.make(14, "days").toISOString()
    );

    expect(iso.beforeYesterday).toBe(dates.beforeYesterday.toISOString());
    expect(iso.yesterday).toBe(dates.yesterday.toISOString());
    expect(iso.today).toBe(dates.today.toISOString());
    expect(iso.tomorrow).toBe(dates.tomorrow.toISOString());
    expect(iso.nextWeek).toBe(dates.nextWeek.toISOString());
    expect(iso.lastFortnight).toBe(dates.lastFortnight.toISOString());

    expect(fmt.beforeYesterday).toBe(
      dates.beforeYesterday.toISOString().substring(0, 10)
    );
    expect(fmt.today).toBe(dates.today.toISOString().substring(0, 10));
    expect(fmt.afterTomorrow).toBe(
      dates.afterTomorrow.toISOString().substring(0, 10)
    );
    expect(fmt.nextWeek).toBe(
      dates.nextWeek.toISOString().substring(0, 10)
    );
    expect(fmt.nextFortnight).toBe(
      dates.nextFortnight.toISOString().substring(0, 10)
    );
  });

  it("delegates to underlying factory for parsing", () => {
    expect(dates.fromPhrase("2 days from now").toISOString()).toBe(
      "2024-03-12T08:15:00.000Z"
    );
    expect(dates.fromPhraseSafe("invalid").getTime()).toBeNaN();
  });

  it("supports custom offsets", () => {
    expect(dates.make(-3, "days").toISOString()).toBe(
      "2024-03-07T08:15:00.000Z"
    );
  });
});
