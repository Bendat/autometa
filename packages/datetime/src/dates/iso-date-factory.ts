import type { DateFactory, DateShortcut } from "./date-factory.js";
import type { StandardTimeUnit } from "./time-units.js";

export interface IsoDateFactoryOptions {
  serializer?: (date: Date) => string;
}

export class IsoDateFactory {
  private readonly serialise: (date: Date) => string;

  constructor(
    private readonly dateFactory: DateFactory,
    options: IsoDateFactoryOptions = {}
  ) {
    this.serialise = options.serializer ?? ((date) => date.toISOString());
  }

  make(offset: number, unit: StandardTimeUnit | string): string {
    return this.serialise(this.dateFactory.make(offset, unit));
  }

  fromPhrase(phrase: unknown): string {
    return this.serialise(this.dateFactory.fromPhrase(phrase));
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
    return this.serialise(this.dateFactory.find(shortcut));
  }
}
