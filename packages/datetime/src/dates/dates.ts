import { DateFactory } from "./date-factory";
import { IsoDateFactory } from "./iso-date-factory";
import { FmtDateFactory } from "./formatted-date-factory";
import { TimeUnit } from "@autometa/phrases";

export class DatesObject {
  #factory: DateFactory = new DateFactory();
  #iso = new IsoDateFactory(this.#factory);
  #fmt = new FmtDateFactory(this.#factory);
  get iso() {
    return this.#iso;
  }

  get fmt() {
    return this.#fmt;
  }

  get now(): Date {
    return this.#factory.phraseMap.get("now").call(null);
  }

  get beforeYesterday(): Date {
    return this.#factory.phraseMap.get("beforeYesterday")?.call(null);
  }

  get yesterday(): Date {
    return this.#factory.phraseMap.get("yesterday")?.call(null);
  }

  get today(): Date {
    return this.#factory.phraseMap.get("today")?.call(null);
  }

  get tomorrow(): Date {
    return this.#factory.phraseMap.get("tomorrow")?.call(null);
  }

  get afterTomorrow(): Date {
    return this.#factory.phraseMap.get("afterTomorrow")?.call(null);
  }

  get midnight(): Date {
    return this.#factory.phraseMap.get("midnight")?.call(null);
  }

  get lastWeek(): Date {
    return this.#factory.phraseMap.get("lastWeek")?.call(null);
  }

  get nextWeek(): Date {
    return this.#factory.phraseMap.get("nextWeek")?.call(null);
  }

  get lastFortnight(): Date {
    return this.#factory.phraseMap.get("lastFortnight")?.call(null);
  }

  get nextFortnight(): Date {
    return this.#factory.phraseMap.get("nextFortnight")?.call(null);
  }

  fromPhrase(phrase: string) {
    return this.#factory.fromPhrase(phrase);
  }

  fromPhraseSafe(phrase: string) {
    return this.#factory.fromPhraseSafe(phrase);
  }

  make(timeOffset: number, timeUnit: TimeUnit) {
    return this.#factory.make(timeOffset, timeUnit);
  }
}

export const Dates = new DatesObject();
