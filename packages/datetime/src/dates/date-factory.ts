import { TimeUnit, camel, convertPhrase } from "@autometa/phrases";
import { midnight } from "./midnight";

export class DateFactory {
  phraseMap = new Map<string, Date>([
    ["beforeYesterday", this.make(-2, "days")],
    ["yesterday", this.make(-1, "days")],
    ["today", this.make(0, "days")],
    ["tomorrow", this.make(1, "days")],
    ["afterTomorrow", this.make(2, "days")],
    ["nextWeek", this.make(7, "days")],
    ["lastWeek", this.make(-7, "days")],
    ["nextFortnight", this.make(14, "days")],
    ["lastFortnight", this.make(-14, "days")],
    ["midnight", midnight()]
  ]);

  fromPhrase(phrase: string) {
    const name = convertPhrase(phrase, camel);
    if (this.phraseMap.has(name)) {
      return this.phraseMap.get(name);
    }
    const matchDay = this.#matchDayPhrase(phrase);
    if (matchDay) {
      return matchDay;
    }
    const parsed = new Date(phrase);
    if (!isNaN(parsed.getTime())) return parsed;
    throw new Error(`Cannot find date matching '${phrase}'`);
  }

  make(daysOffset: number, timeunit: TimeUnit) {
    switch (timeunit) {
      case "days":
        return this.#addDays(daysOffset);
      case "seconds":
        return this.#addSeconds(daysOffset);
      case "milliseconds":
        return this.#addMilliseconds(daysOffset);
      case "hours":
        return this.#addHours(daysOffset);
      case "minutes":
        return this.#addMinutes(daysOffset);
      default:
        throw new Error(
          `Invalid timeunit ${timeunit}, options are 'days', 'seconds', 'milliseconds', 'hours', 'minutes'`
        );
    }
  }

  #matchDayPhrase(phrase: string) {
    if (phrase.match(/\d+ day(s)? ago?/gi)) {
      const value = Number(phrase.match(/\d+/gi)?.pop());
      return this.make(-value, "days");
    }
    if (phrase.match(/\d+ day(s)?( from now)?/gi)) {
      const value = Number(phrase.match(/\d+/gi)?.pop());
      return this.make(value, "days");
    }
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
