import { DateFactory } from './date-factory';
import { IsoDateFactory } from './iso-date-factory';
import { FmtDateFactory } from './formatted-date-factory';
import { TimeUnit } from '@autometa/phrases';

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
  get beforeYesterday() {
    return this.#factory.phraseMap.get('beforeYesterday');
  }
  get yesterday() {
    return this.#factory.phraseMap.get('yesterday');
  }
  get today() {
    return this.#factory.phraseMap.get('today');
  }
  get tomorrow() {
    return this.#factory.phraseMap.get('tomorrow');
  }
  get afterTomorrow() {
    return this.#factory.phraseMap.get('afterTomorrow');
  }
  get midnight() {
    return this.#factory.phraseMap.get('midnight');
  }
  get lastWeek() {
    return this.#factory.phraseMap.get('lastWeek');
  }
  get nextWeek() {
    return this.#factory.phraseMap.get('nextWeek');
  }
  get lastFortnight() {
    return this.#factory.phraseMap.get('lastFortnight');
  }
  get nextFortnight() {
    return this.#factory.phraseMap.get('nextFortnight');
  }
  fromPhrase(phrase: string) {
    return this.#factory.fromPhrase(phrase);
  }
  make(timeOffset: number, timeUnit: TimeUnit) {
    return this.#factory.make(timeOffset, timeUnit);
  }
}
export const Dates = new DatesObject();
