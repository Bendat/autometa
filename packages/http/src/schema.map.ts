import { AutomationError } from "@autometa/errors";
import { SchemaParser, StatusCode } from "./types";
export class SchemaMap {
  #map: Map<StatusCode, SchemaParser>;
  constructor(map?: Map<StatusCode, SchemaParser> | SchemaMap) {
    if (map instanceof SchemaMap) {
      this.#map = new Map(map.#map);
      return;
    }
    this.#map = new Map(map);
  }

  derive() {
    return new SchemaMap(this.#map);
  }

  registerStatus(parser: SchemaParser, ...codes: StatusCode[]) {
    codes.forEach((code) => {
      if (this.#map.has(code)) {
        const msg = `Status code ${code} is already registered with a parser`;
        throw new Error(msg);
      }
      this.#map.set(code, parser);
    });
  }

  registerRange(parser: SchemaParser, from: StatusCode, to: StatusCode) {
    for (let i = from; i <= to; i++) {
      if (this.#map.has(i)) {
        throw new Error(`Status code ${i} is already registered with a parser`);
      }
      this.#map.set(i, parser);
    }
  }

  validate(status: StatusCode, data: unknown, requireSchema: boolean) {
    const parser = this.getParser(status, requireSchema);
    if ("parse" in parser) {
      return parser.parse(data);
    }
    if ("validate" in parser) {
      return parser.validate(data);
    }
    try {
      return parser(data);
    } catch (e) {
      const msg = `Failed to schema parse response data for status code ${status} with data:
      
${JSON.stringify(data, null, 2)}}`;
      throw new AutomationError(msg, { cause: e as Error });
    }
  }

  getParser(status: StatusCode, requireSchema: boolean) {
    const parser = this.#map.get(status);
    if (!parser && requireSchema) {
      const msg = `No parser registered for status code ${status} but 'requireSchema' is true`;
      throw new Error(msg);
    }
    if (parser) {
      return parser;
    }
    return (data: unknown) => data;
  }

  toObject() {
    return Object.fromEntries(this.#map) as Record<StatusCode, SchemaParser>;
  }
}
