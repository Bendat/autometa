import { DateFactory, type DateFactoryOptions, type DateShortcut } from "./date-factory.js";
import { FormattedDateFactory } from "./formatted-date-factory.js";
import { IsoDateFactory } from "./iso-date-factory.js";
import type { StandardTimeUnit } from "./time-units.js";

export interface DatesOptions extends DateFactoryOptions {
  factory?: DateFactory;
}

export interface DatesObject {
  readonly iso: IsoDateFactory;
  readonly fmt: FormattedDateFactory;
  readonly now: Date;
  readonly beforeYesterday: Date;
  readonly yesterday: Date;
  readonly today: Date;
  readonly tomorrow: Date;
  readonly afterTomorrow: Date;
  readonly midnight: Date;
  readonly lastWeek: Date;
  readonly nextWeek: Date;
  readonly lastFortnight: Date;
  readonly nextFortnight: Date;
  fromPhrase(phrase: unknown): Date;
  fromPhraseSafe(phrase: unknown): Date;
  make(offset: number, unit: StandardTimeUnit | string): Date;
}

class DatesFacade implements DatesObject {
  readonly iso: IsoDateFactory;
  readonly fmt: FormattedDateFactory;

  constructor(private readonly factory: DateFactory) {
    this.iso = new IsoDateFactory(factory);
    this.fmt = new FormattedDateFactory(factory);
  }

  get now(): Date {
    return this.fromShortcut("now");
  }

  get beforeYesterday(): Date {
    return this.fromShortcut("beforeYesterday");
  }

  get yesterday(): Date {
    return this.fromShortcut("yesterday");
  }

  get today(): Date {
    return this.fromShortcut("today");
  }

  get tomorrow(): Date {
    return this.fromShortcut("tomorrow");
  }

  get afterTomorrow(): Date {
    return this.fromShortcut("afterTomorrow");
  }

  get midnight(): Date {
    return this.fromShortcut("midnight");
  }

  get lastWeek(): Date {
    return this.fromShortcut("lastWeek");
  }

  get nextWeek(): Date {
    return this.fromShortcut("nextWeek");
  }

  get lastFortnight(): Date {
    return this.fromShortcut("lastFortnight");
  }

  get nextFortnight(): Date {
    return this.fromShortcut("nextFortnight");
  }

  fromPhrase(phrase: unknown): Date {
    return this.factory.fromPhrase(phrase);
  }

  fromPhraseSafe(phrase: unknown): Date {
    return this.factory.fromPhraseSafe(phrase);
  }

  make(offset: number, unit: StandardTimeUnit | string): Date {
    return this.factory.make(offset, unit);
  }

  private fromShortcut(shortcut: DateShortcut): Date {
    return this.factory.find(shortcut);
  }
}

export function createDates(options: DatesOptions = {}): DatesObject {
  const factory = options.factory ?? new DateFactory(options);
  return new DatesFacade(factory);
}

export const Dates = createDates();
export type { DateFactoryOptions };
