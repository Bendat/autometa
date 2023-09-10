import { TimeUnit, camel, convertPhrase, collapse } from "@autometa/phrases";
import { midnight } from "./midnight";
import { AutomationError, raise } from "@autometa/errors";
import { ConfirmDefined, ConfirmLengthAtLeast } from "@autometa/asserters";

type TimeShortcut =
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

function isTimeShortcut(text: string): text is TimeShortcut {
  const includes = [
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
    "nextFortnight"
  ].includes(text);
  if (!includes) {
    return false
  }
  return true
}
export class DateFactory {
  phraseMap = new Map<TimeShortcut, () => Date>([
    ["now", () => this.make(0, "days")],
    ["beforeYesterday", () => this.make(-2, "days")],
    ["yesterday", () => this.make(-1, "days")],
    ["today", () => this.make(0, "days")],
    ["tomorrow", () => this.make(1, "days")],
    ["afterTomorrow", () => this.make(2, "days")],
    ["nextWeek", () => this.make(7, "days")],
    ["lastWeek", () => this.make(-7, "days")],
    ["nextFortnight", () => this.make(14, "days")],
    ["lastFortnight", () => this.make(-14, "days")],
    ["midnight", midnight]
  ]);

  // eslint-disable-next-line @typescript-eslint/ban-types
  find(name: TimeShortcut): Date {
    const result = this.phraseMap.get(name);
    if (result) {
      return result();
    }
    raise(
      `Could not find date shortcut ${name}. Please use a valid date shortcut from the following list: ${Array.from(
        this.phraseMap.keys()
      ).join(", ")}`
    );
  }

  fromPhraseSafe(phrase: string) {
    const name = convertPhrase(phrase, camel);
    if (isTimeShortcut(name)) {
      if (this.phraseMap.has(name)) {
        return this.phraseMap.get(name)?.call(this);
      }
    }

    const matchDay = this.#extractTimeFromPhrase(phrase);
    if (matchDay) {
      return matchDay;
    }
    const parsed = new Date(phrase);
    if (isNaN(parsed.getTime())) {
      return new Date(Date.parse(phrase));
    }
    return parsed;
  }
  fromPhrase(phrase: string) {
    const result = this.fromPhraseSafe(phrase);
    if (result) {
      return result;
    }
    raise(
      `Could not parse date from phrase ${phrase}. Please use a valid date string or a phrase from the following list: ${Array.from(
        this.phraseMap.keys()
      ).join(", ")}`
    );
  }
  make(timeOffset: number, timeunit: TimeUnit) {
    const unit = timeunit.endsWith("s") ? timeunit : `${timeunit}s`;
    switch (unit) {
      case "years":
        return this.#addYears(timeOffset);
      case "months":
        return this.#addMonths(timeOffset);
      case "weeks":
        return this.#addWeeks(timeOffset);
      case "days":
        return this.#addDays(timeOffset);
      case "seconds":
        return this.#addSeconds(timeOffset);
      case "milliseconds":
        return this.#addMilliseconds(timeOffset);
      case "hours":
        return this.#addHours(timeOffset);
      case "minutes":
        return this.#addMinutes(timeOffset);
      default:
        throw new AutomationError(
          `Invalid timeunit ${timeunit}, options are 'days', 'seconds', 'milliseconds', 'hours', 'minutes'. Non plural equivalents such as 'day' or 'week' are also accepted.`
        );
    }
  }
  #extractTimeFromPhrase(phrase: string) {
    return (
      this.#extractFutureFromPhrase(phrase) ??
      this.#extractPastFromPhrase(phrase)
    );
  }
  #extractFutureFromPhrase(phrase: string) {
    const pastPattern = /(\d+) (.*)s? from now?/;
    const pastMatch = pastPattern.exec(phrase);

    if (ConfirmDefined(pastMatch) && ConfirmLengthAtLeast(pastMatch, 3)) {
      const [_, value, unit] = pastMatch;
      const timeunit = convertPhrase(unit, collapse) as TimeUnit;
      return this.make(Number(value), timeunit);
    }
  }
  #extractPastFromPhrase(phrase: string) {
    const pastPattern = /(\d+) (.*)(s)? ago?/gm;
    const pastMatch = pastPattern.exec(phrase);
    if (ConfirmDefined(pastMatch) && ConfirmLengthAtLeast(pastMatch, 3)) {
      const [_, value, unit] = pastMatch;
      const timeunit = convertPhrase(unit, camel) as TimeUnit;
      return this.make(-Number(value), timeunit);
    }
  }
  #addYears(yearsOffset: number) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + yearsOffset);
    return date;
  }
  #addMonths(monthOffset: number) {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }
  #addWeeks(weekOffset: number) {
    const date = new Date();
    date.setMonth(date.getMonth() + weekOffset / 4);
    return date;
  }
  #addDays(daysOffset: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }

  #addSeconds(secondsOffset: number) {
    const date = new Date();
    date.setSeconds(date.getSeconds() + secondsOffset);
    return date;
  }

  #addMilliseconds(millisecondsOffset: number) {
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + millisecondsOffset);
    return date;
  }
  #addHours(hoursOffset: number) {
    const date = new Date();
    date.setHours(date.getHours() + hoursOffset);
    return date;
  }
  #addMinutes(minutesOffset: number) {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutesOffset);
    return date;
  }
}
