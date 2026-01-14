import { describe, expect, it } from "vitest";
import {
  DateFactory,
  type DateShortcut,
} from "../dates/date-factory.js";
import { FormattedDateFactory } from "../dates/formatted-date-factory.js";
import { IsoDateFactory } from "../dates/iso-date-factory.js";
import type { Clock } from "../dates/clock.js";

class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return new Date(this.fixed.getTime());
  }
}

const BASE = new Date("2024-06-05T10:20:30.000Z");

function createFactory(): DateFactory {
  return new DateFactory({ clock: new FixedClock(BASE) });
}

describe("Date adapters", () => {
  type AdapterShortcut = Exclude<DateShortcut, "now">;

  it("serialises ISO strings across helpers", () => {
    const factory = createFactory();
    const iso = new IsoDateFactory(factory);
    const shortcuts: AdapterShortcut[] = [
      "beforeYesterday",
      "yesterday",
      "today",
      "tomorrow",
      "afterTomorrow",
      "midnight",
      "lastWeek",
      "nextWeek",
      "lastFortnight",
      "nextFortnight",
    ];

    expect(iso.today).toBe("2024-06-05T10:20:30.000Z");
    expect(iso.afterTomorrow).toBe("2024-06-07T10:20:30.000Z");
    expect(iso.make(1, "weeks")).toBe("2024-06-12T10:20:30.000Z");
    expect(iso.fromPhrase("2 days ago")).toBe("2024-06-03T10:20:30.000Z");

    for (const shortcut of shortcuts) {
      expect((iso as Record<AdapterShortcut, string>)[shortcut]).toBe(
        factory.find(shortcut).toISOString()
      );
    }
  });

  it("formats dates with defaults and custom formatters", () => {
    const factory = createFactory();
    const fmt = new FormattedDateFactory(factory);
    const shortcuts: AdapterShortcut[] = [
      "beforeYesterday",
      "yesterday",
      "today",
      "tomorrow",
      "afterTomorrow",
      "midnight",
      "lastWeek",
      "nextWeek",
      "lastFortnight",
      "nextFortnight",
    ];
    const format = (date: Date) => date.toISOString().substring(0, 10);

    expect(fmt.today).toBe("2024-06-05");
    expect(fmt.beforeYesterday).toBe("2024-06-03");
    expect(fmt.midnight).toBe("2024-06-06");

    for (const shortcut of shortcuts) {
      expect((fmt as Record<AdapterShortcut, string>)[shortcut]).toBe(
        format(factory.find(shortcut))
      );
    }

    const custom = new FormattedDateFactory(factory, {
      formatter: (date) => date.toUTCString(),
    });
    expect(custom.fromPhrase("tomorrow")).toBe(
      "Thu, 06 Jun 2024 10:20:30 GMT"
    );
    expect(custom.make(90, "minutes")).toBe(
      "Wed, 05 Jun 2024 11:50:30 GMT"
    );
  });

  it("supports custom ISO serializers", () => {
    const factory = createFactory();
    const iso = new IsoDateFactory(factory, {
      serializer: (date) => date.toUTCString(),
    });

    expect(iso.fromPhrase("today")).toBe("Wed, 05 Jun 2024 10:20:30 GMT");
  });
});
