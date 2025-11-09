import type { DateFactory, DateShortcut } from "./date-factory.js";
import type { StandardTimeUnit } from "./time-units.js";

export interface FormattedDateFactoryOptions {
  formatter?: (date: Date) => string;
}

export class FormattedDateFactory {
  private readonly format: (date: Date) => string;

  constructor(
    private readonly dateFactory: DateFactory,
    options: FormattedDateFactoryOptions = {}
  ) {
    this.format =
      options.formatter ?? ((date) => date.toISOString().substring(0, 10));
  }

  make(offset: number, unit: StandardTimeUnit | string): string {
    return this.format(this.dateFactory.make(offset, unit));
  }

  fromPhrase(phrase: unknown): string {
    return this.format(this.dateFactory.fromPhrase(phrase));
  }

  get beforeYesterday(): string {
    return this.fromShortcut("beforeYesterday");
  }

  get yesterday(): string {
    return this.fromShortcut("yesterday");
  }

  get today(): string {
    return this.fromShortcut("today");
  }

  get tomorrow(): string {
    return this.fromShortcut("tomorrow");
  }

  get afterTomorrow(): string {
    return this.fromShortcut("afterTomorrow");
  }

  get midnight(): string {
    return this.fromShortcut("midnight");
  }

  get lastWeek(): string {
    return this.fromShortcut("lastWeek");
  }

  get nextWeek(): string {
    return this.fromShortcut("nextWeek");
  }

  get lastFortnight(): string {
    return this.fromShortcut("lastFortnight");
  }

  get nextFortnight(): string {
    return this.fromShortcut("nextFortnight");
  }

  private fromShortcut(shortcut: DateShortcut): string {
    return this.format(this.dateFactory.find(shortcut));
  }
}
