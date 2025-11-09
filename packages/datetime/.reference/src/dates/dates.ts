import { DateFactory } from "./date-factory";
import { IsoDateFactory } from "./iso-date-factory";
import { FmtDateFactory } from "./formatted-date-factory";
import { TimeUnit } from "@autometa/phrases";

export class DatesObject {
  #factory: DateFactory = new DateFactory();
  #iso = new IsoDateFactory(this.#factory);
  #fmt = new FmtDateFactory(this.#factory);
  /**
   * Switches to the ISO factory, which offers an identical interface
   * but returns ISO strings instead of Date objects.
   *
   * Example: `2020-01-01T00:00:00.000Z`
   */
  get iso() {
    return this.#iso;
  }

  /**
   * Switches to the formatted factory, which offers an identical interface
   * but returns formatted strings instead of Date objects.
   *
   * Example: `2020-01-01`
   */
  get fmt() {
    return this.#fmt;
  }

  /**
   * Returns the current date and time.
   */
  get now() {
    return this.#factory.find("now");
  }

  /**
   * Returns the date and time of the day before yesterday
   */
  get beforeYesterday(): Date {
    return this.#factory.find("beforeYesterday");
  }

  /**
   * Returns the date and time of yesterday
   */
  get yesterday(): Date {
    return this.#factory.find("yesterday");
  }

  /**
   * Returns the date and time of today
   */
  get today(): Date {
    return this.#factory.find("today");
  }

  /**
   * Returns the date and time of tomorrow
   */
  get tomorrow(): Date {
    return this.#factory.find("tomorrow");
  }

  /**
   * Returns the date and time of the day after tomorrow
   */
  get afterTomorrow(): Date {
    return this.#factory.find("afterTomorrow");
  }

  /**
   * Returns the date and time of midnight today
   */
  get midnight(): Date {
    return this.#factory.find("midnight");
  }

  /**
   * Returns the date and time of today 1 week ago
   */
  get lastWeek(): Date {
    return this.#factory.find("lastWeek");
  }

  /**
   * Returns the date and time of today 1 week from now
   */
  get nextWeek(): Date {
    return this.#factory.find("nextWeek");
  }

  /**
   * Returns the date and time of today 2 weeks ago
   */
  get lastFortnight(): Date {
    return this.#factory.find("lastFortnight");
  }

  /**
   * Returns the date and time of today 2 weeks from now
   */
  get nextFortnight(): Date {
    return this.#factory.find("nextFortnight");
  }

  /**
   * Attempts to parse a phrase into a date.
   * @param phrase
   * @returns
   */
  fromPhrase(phrase: string) {
    return this.#factory.fromPhrase(phrase);
  }

  /**
   * Attempts to parse a phrase into a date.
   * If the phrase is invalid, it will return an invalid date instead of throwing.
   * @param phrase
   * @returns
   */
  fromPhraseSafe(phrase: string) {
    return this.#factory.fromPhraseSafe(phrase);
  }

  make(timeOffset: number, timeUnit: TimeUnit) {
    return this.#factory.make(timeOffset, timeUnit);
  }
}

/**
 * Date utility option to easily generate common
 * dates around the current date, like 'today', 'midnight',
 * 'tomorrow', 'nextWeek', etc.
 *
 * The Dates utility also supports certain language phrases
 * that might be natural in Cucumber's gherkin syntax, like
 * 'next week', 'last week', 'next fortnight', etc. as well
 * as more dynamic phrases like `1 day ago`, `2 weeks from now`,
 */
export const Dates = new DatesObject();
