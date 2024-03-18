import { TimeUnit } from "@autometa/phrases";
import { midnight } from "./midnight";
import { DateFactory } from "./date-factory";

export class IsoDateFactory {
  constructor(readonly dateFactory: DateFactory) {}
  phraseMap = new Map<string, string>([
    ["beforeYesterday", this.make(-2, "days")],
    ["yesterday", this.make(-1, "days")],
    ["today", this.make(0, "days")],
    ["tomorrow", this.make(1, "days")],
    ["afterTomorrow", this.make(2, "days")],
    ["nextWeek", this.make(7, "days")],
    ["lastWeek", this.make(-7, "days")],
    ["nextFortnight", this.make(14, "days")],
    ["lastFortnight", this.make(-14, "days")],
    ["midnight", midnight().toISOString()],
  ]);
  make(daysOffset: number, timeunit: TimeUnit) {
    return this.dateFactory.make(daysOffset, timeunit).toISOString();
  }

  /**
   * Attempts to parse a phrase into a date.
   * @param phrase
   * @returns
   */
  fromPhrase(phrase: string) {
    return this.dateFactory.fromPhrase(phrase)?.toISOString();
  }

  /**
   * Returns the date and time of the day before yesterday
   */
  get beforeYesterday() {
    return this.phraseMap.get("beforeYesterday");
  }

  /**
   * Returns the date and time of yesterday
   */
  get yesterday() {
    return this.phraseMap.get("yesterday");
  }

  /**
   * Returns the date and time of today
   */
  get today() {
    return this.phraseMap.get("today");
  }

  /**
   * Returns the date and time of tomorrow
   */
  get tomorrow() {
    return this.phraseMap.get("tomorrow");
  }

  /**
   * Returns the date and time of the day after tomorrow
   */
  get afterTomorrow() {
    return this.phraseMap.get("afterTomorrow");
  }

  /**
   * Returns the date and time of midnight today
   */
  get midnight() {
    return this.phraseMap.get("midnight");
  }

  /**
   * Returns the date and time of today 1 week ago
   */
  get lastWeek() {
    return this.phraseMap.get("lastWeek");
  }

  /**
   * Returns the date and time of today 1 week from now
   */
  get nextWeek() {
    return this.phraseMap.get("nextWeek");
  }
  get lastFortnight() {
    return this.phraseMap.get("lastFortnight");
  }

  /**
   * Returns the date and time of today 1 fortnight from now
   */
  get nextFortnight() {
    return this.phraseMap.get("nextFortnight");
  }
}
