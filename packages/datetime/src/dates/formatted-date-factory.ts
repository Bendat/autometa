import { TimeUnit } from '@autometa/phrases';
import { DateFactory } from './date-factory';
import { midnight } from './midnight';

export class FmtDateFactory {
  constructor(readonly dateFactory: DateFactory) { }
  phraseMap = new Map<string, string>([
    ['beforeYesterday', this.make(-2, 'days')],
    ['yesterday', this.make(-1, 'days')],
    ['today', this.make(0, 'days')],
    ['tomorrow', this.make(1, 'days')],
    ['afterTomorrow', this.make(2, 'days')],
    ['nextWeek', this.make(7, 'days')],
    ['lastWeek', this.make(-7, 'days')],
    ['nextFortnight', this.make(14, 'days')],
    ['lastFortnight', this.make(-14, 'days')],
    ['midnight', midnight().toISOString()],
  ]);
  make(daysOffset: number, timeunit: TimeUnit) {
    return this.dateFactory
      .make(daysOffset, timeunit)
      .toISOString()
      .split('T')[0];
  }
  fromPhrase(phrase: string) {
    return this.dateFactory.fromPhrase(phrase)?.toISOString().split('T')[0];
  }
  get beforeYesterday() {
    return this.phraseMap.get('beforeYesterday');
  }
  get yesterday() {
    return this.phraseMap.get('yesterday');
  }
  get today() {
    return this.phraseMap.get('today');
  }
  get tomorrow() {
    return this.phraseMap.get('tomorrow');
  }
  get afterTomorrow() {
    return this.phraseMap.get('afterTomorrow');
  }
  get midnight() {
    return this.phraseMap.get('midnight');
  }
  get lastWeek() {
    return this.phraseMap.get('lastWeek');
  }
  get nextWeek() {
    return this.phraseMap.get('nextWeek');
  }
  get lastFortnight() {
    return this.phraseMap.get('lastFortnight');
  }
  get nextFortnight() {
    return this.phraseMap.get('nextFortnight');
  }
}
