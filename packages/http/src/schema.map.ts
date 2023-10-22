import { StatusCode, SchemaParser } from "./types";
import { AutomationError } from "@autometa/errors";
import { StatusCodes } from "@autometa/status-codes";

export class SchemaMap {
  #children: SchemaMap[] = [];
  #map: Map<StatusCode, SchemaParser> = new Map();
  register(
    parser: SchemaParser,
    ...codes: StatusCode[]
  ): (typeof parser)["parse"];
  register(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): (typeof parser)["parse"];
  register(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    args.forEach((arg) => {
      if (typeof arg === "number") {
        this.registerSingle(parser, arg);
      } else {
        this.registerRange(parser, arg);
      }
    });
    return parser.parse;
  }

  registerSingle(parser: SchemaParser, ...codes: StatusCode[]) {
    codes.forEach((code) => {
      if (this.#map.has(code)) {
        throw new AutomationError(
          `Status code ${code} is already registered with a parser`
        );
      }
      assertIsStatusCode(code);
      this.#map.set(code, parser);
    });
  }

  including(map: SchemaMap) {
    this.#children.includes(map);
    return this;
  }
  registerRange(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ) {
    range.forEach(({ from, to }) => {
      assertIsStatusCode(from);
      assertIsStatusCode(to);
      for (let i = from; i <= to; i++) {
        if (!IsStatusCode(i)) {
          continue;
        }
        if (this.#map.has(i)) {
          throw new AutomationError(
            `Status code ${i} is already registered with a parser`
          );
        }
        this.#map.set(i, parser);
      }
    });
  }

  get(status: StatusCode): SchemaParser | undefined {
    assertIsStatusCode(status);
    const local = this.#map.get(status);
    if (local) {
      return local;
    }
    const nested = this.#children.find((it) => it.#map.has(status));
    return nested?.get(status);
  }

  validate<T>(status: StatusCode, response: T, strict: boolean) {
    const parser = this.get(status);
    if (!parser) {
      if (!strict) {
        return response;
      }
      throw new AutomationError(
        `No schema parser registered for status code ${status} and 'requireSchema' is set to true`
      );
    }
    return parser.parse(response);
  }
}

export function assertIsStatusCode(value: number): asserts value is StatusCode {
  const result = Object.values(StatusCodes)
    .map((it) => it.status as number)
    .includes(value);
  if (!result) {
    throw new AutomationError(
      `Expected status code ${value} to be a valid status code, but it is not a known HTTP codeF`
    );
  }
}

export function IsStatusCode(value: number): value is StatusCode {
  return Object.values(StatusCodes)
    .map((it) => it.status as number)
    .includes(value);
}
