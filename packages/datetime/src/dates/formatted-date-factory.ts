import { TimeUnit } from '@autometa/phrases';
import { DateFactory } from './date-factory';


export class FmtDateFactory {
  constructor(readonly dateFactory: DateFactory) { }
  make(daysOffset: number, timeunit: TimeUnit) {
    return this.dateFactory
      .make(daysOffset, timeunit)
      .toISOString()
      .split('T')[0];
  }
  fromPhrase(phrase: string) {
    return this.dateFactory.fromPhrase(phrase)?.toISOString().split('T')[0];
  }
}
