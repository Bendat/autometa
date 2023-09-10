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

  get now() {
    return this.#factory.find("now");
  }

  get beforeYesterday(): Date {
    return this.#factory.find("beforeYesterday");
  }

  get yesterday(): Date {
    return this.#factory.find("yesterday");
  }

  get today(): Date {
    return this.#factory.find("today");
  }

  get tomorrow(): Date {
    return this.#factory.find("tomorrow");
  }

  get afterTomorrow(): Date {
    return this.#factory.find("afterTomorrow");
  }

  get midnight(): Date {
    return this.#factory.find("midnight");
  }

  get lastWeek(): Date {
    return this.#factory.find("lastWeek");
  }

  get nextWeek(): Date {
    return this.#factory.find("nextWeek");
  }

  get lastFortnight(): Date {
    return this.#factory.find("lastFortnight");
  }

  get nextFortnight(): Date {
    return this.#factory.find("nextFortnight");
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
