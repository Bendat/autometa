import { AutomationError } from "@autometa/errors";
import {
  isValidDate,
  isValidISODateString,
  isValidTime,
  isValidYearMonth,
} from "iso-datestring-validator";
import type { Clock } from "./clock.js";
import { cloneDate, systemClock } from "./clock.js";
import {
  resolveTimeUnit,
  type StandardTimeUnit,
} from "./time-units.js";
import { normalizeToken, toCamelKey } from "../shared/phrases.js";

export type DateShortcut =
  | "now"
  | "beforeYesterday"
  | "yesterday"
  | "today"
  | "tomorrow"
  | "afterTomorrow"
  | "midnight"
  | "lastWeek"
  | "nextWeek"
  | "lastFortnight"
  | "nextFortnight";

const SHORTCUT_LOOKUP = new Set<DateShortcut>([
  "now",
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
]);

export interface DateFactoryOptions {
  clock?: Clock;
}

interface RelativePhraseMatch {
  offset: number;
  unit: StandardTimeUnit;
}

const FUTURE_PATTERN = /^(\d+)\s+([A-Za-z\s]+?)\s+from\s+now$/i;
const PAST_PATTERN = /^(\d+)\s+([A-Za-z\s]+?)\s+ago$/i;

function invalidDate(): Date {
  return new Date(Number.NaN);
}

function isDateShortcut(value: string): value is DateShortcut {
  return SHORTCUT_LOOKUP.has(value as DateShortcut);
}

export class DateFactory {
  private readonly clock: Clock;

  constructor(options: DateFactoryOptions = {}) {
    this.clock = options.clock ?? systemClock;
  }

  find(shortcut: DateShortcut): Date {
    switch (shortcut) {
      case "now":
        return this.currentDate();
      case "beforeYesterday":
        return this.make(-2, "days");
      case "yesterday":
        return this.make(-1, "days");
      case "today":
        return this.make(0, "days");
      case "tomorrow":
        return this.make(1, "days");
      case "afterTomorrow":
        return this.make(2, "days");
      case "midnight":
        return this.midnight();
      case "lastWeek":
        return this.make(-1, "weeks");
      case "nextWeek":
        return this.make(1, "weeks");
      case "lastFortnight":
        return this.make(-14, "days");
      case "nextFortnight":
        return this.make(14, "days");
      default:
        throw new AutomationError(
          `Unsupported date shortcut '${shortcut}'.`
        );
    }
  }

  fromPhraseSafe(phrase: unknown): Date {
    if (typeof phrase !== "string") {
      return invalidDate();
    }

    const trimmed = phrase.trim();
    if (trimmed.length === 0) {
      return invalidDate();
    }

  const shortcutCandidate = toCamelKey(trimmed);
    if (isDateShortcut(shortcutCandidate)) {
      return this.find(shortcutCandidate);
    }

    const relative = this.extractRelative(trimmed);
    if (relative) {
      return this.make(relative.offset, relative.unit);
    }

    if (this.isDateLike(trimmed)) {
      return this.parseDate(trimmed);
    }

    return invalidDate();
  }

  fromPhrase(phrase: unknown): Date {
    const result = this.fromPhraseSafe(phrase);
    if (Number.isNaN(result.getTime())) {
      throw new AutomationError(
        `Could not parse date from phrase '${String(phrase)}'. ` +
          `Valid shortcuts are: ${[...SHORTCUT_LOOKUP].join(", ")}.`
      );
    }
    return result;
  }

  make(timeOffset: number, timeUnit: string | StandardTimeUnit): Date {
    if (!Number.isFinite(timeOffset)) {
      throw new AutomationError(
        `Time offset must be finite. Received '${timeOffset}'.`
      );
    }

    const { unit, scale } = resolveTimeUnit(String(timeUnit));
    const offset = timeOffset * scale;
    const date = this.currentDate();

    switch (unit) {
      case "years":
        date.setFullYear(date.getFullYear() + offset);
        break;
      case "months":
        date.setMonth(date.getMonth() + offset);
        break;
      case "weeks":
        date.setDate(date.getDate() + offset * 7);
        break;
      case "days":
        date.setDate(date.getDate() + offset);
        break;
      case "hours":
        date.setHours(date.getHours() + offset);
        break;
      case "minutes":
        date.setMinutes(date.getMinutes() + offset);
        break;
      case "seconds":
        date.setSeconds(date.getSeconds() + offset);
        break;
      case "milliseconds":
        date.setMilliseconds(date.getMilliseconds() + offset);
        break;
      default:
        throw new AutomationError(`Unsupported time unit '${unit}'.`);
    }

    return date;
  }

  private currentDate(): Date {
    return cloneDate(this.clock.now());
  }

  private midnight(): Date {
    const date = this.currentDate();
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    return new Date(Date.parse(value));
  }

  private isDateLike(value: string): boolean {
    if (!Number.isNaN(new Date(value).getTime())) {
      return true;
    }
    return (
      isValidDate(value) ||
      isValidISODateString(value) ||
      isValidTime(value) ||
      isValidYearMonth(value)
    );
  }

  private extractRelative(phrase: string): RelativePhraseMatch | undefined {
    const futureMatch = FUTURE_PATTERN.exec(phrase);
    if (futureMatch) {
      return this.buildRelativeMatch(futureMatch, 1);
    }

    const pastMatch = PAST_PATTERN.exec(phrase);
    if (pastMatch) {
      return this.buildRelativeMatch(pastMatch, -1);
    }

    return undefined;
  }

  private buildRelativeMatch(
    match: RegExpExecArray,
    direction: 1 | -1
  ): RelativePhraseMatch | undefined {
    const value = match[1];
    const unit = match[2];
    if (!value || !unit) {
      return undefined;
    }

    const magnitude = Number.parseInt(value, 10);
    if (!Number.isFinite(magnitude)) {
      return undefined;
    }

  const convertedUnit = normalizeToken(unit);
    const { unit: normalisedUnit, scale } = resolveTimeUnit(convertedUnit);
    const offset = magnitude * scale * direction;
    return {
      offset,
      unit: normalisedUnit,
    };
  }
}
