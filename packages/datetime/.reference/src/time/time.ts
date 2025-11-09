import { AssertKey } from "@autometa/asserters";
import { convertPhrase, lower } from "@autometa/phrases";
type TimeDiffFn = (date1: Date, date2: Date) => number;

export class TimeDiff {
  minutes(date1: Date, date2: Date) {
    return this.millis(date1, date2) / 60000;
  }
  seconds(date1: Date, date2: Date) {
    return this.millis(date1, date2) / 1000;
  }
  millis(date1: Date, date2: Date) {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.abs(Math.round(d2 - d1));
  }
  days(date1: Date, date2: Date) {
    return this.millis(date1, date2) / 86400000;
  }
  hours(date1: Date, date2: Date) {
    return this.millis(date1, date2) / 3600000;
  }
  weeks(date1: Date, date2: Date) {
    return this.millis(date1, date2) / 604800000;
  }
  fromPhrase(phrase: string): TimeDiffFn {
    const propertyKey = convertPhrase(phrase, lower);
    AssertKey(this, propertyKey);
    return (this[propertyKey] as TimeDiffFn).bind(this);
  }
}

export class TimeObject {
  #diff = new TimeDiff();
  get diff() {
    return this.#diff;
  }
}

export const Time = new TimeObject();
