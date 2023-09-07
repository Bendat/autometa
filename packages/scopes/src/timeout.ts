import { SizedTimeout, TestTimeout } from "./types";

export abstract class Timeout {
  constructor(readonly value: number) {
    if (typeof value !== "number") {
      const name = this.constructor.name;
      throw new TypeError(
        `Timeunit ${name} must be a number. Instead received ${value} with type ${typeof value}`
      );
    }
  }

  abstract get milliseconds(): number;

  static from(value: undefined): Timeout;
  static from(value: number): Timeout;
  static from(value: SizedTimeout): Timeout;
  static from(value: TestTimeout | undefined): Timeout;
  static from(value: TestTimeout | undefined): Timeout {
    if (value === undefined || value == null) {
      return new NullTimeout(0);
    }
    if (typeof value === "number" && value === 0) {
      return new NullTimeout(0);
    }
    if (typeof value === "number") {
      return new Milliseconds(value);
    }
    if (
      Array.isArray(value) &&
      typeof value[0] === "number" &&
      value[0] === 0
    ) {
      return new NullTimeout(0);
    }

    const [number, unit] = value;
    switch (unit) {
      case "ms":
        return new Milliseconds(number);
      case "s":
        return new Seconds(number);
      case "m":
        return new Minutes(number);
      case "h":
        return new Hours(number);
      default:
        return new Milliseconds(number);
    }
  }
}

export class NullTimeout extends Timeout {
  constructor(value?: number) {
    super(value ?? 0);
  }
  get milliseconds(): number {
    return undefined as unknown as number;
  }
}

export class Milliseconds extends Timeout {
  get milliseconds(): number {
    return this.value;
  }
}

export class Seconds extends Timeout {
  get milliseconds(): number {
    return this.value * 1000;
  }
}

export class Minutes extends Timeout {
  get milliseconds(): number {
    return this.value * 1000 * 60;
  }
}

export class Hours extends Timeout {
  get milliseconds(): number {
    return this.value * 1000 * 60 * 60;
  }
}

export function assertTimeout(
  value: [number, string]
): asserts value is SizedTimeout {
  const [_, unit] = value;
  if (unit !== "ms" && unit !== "s" && unit !== "m" && unit !== "h") {
    throw new TypeError(
      `Expected value to be an instance of Timeout but it was not.`
    );
  }
}
