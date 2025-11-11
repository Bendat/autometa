import type { SchemaParser, StatusCode } from "./types";

export class SchemaMap {
  private map: Map<StatusCode, SchemaParser>;

  constructor(map?: Map<StatusCode, SchemaParser> | SchemaMap) {
    if (map instanceof SchemaMap) {
      this.map = new Map(map.map);
      return;
    }
    this.map = map ? new Map(map) : new Map();
  }

  derive() {
    return new SchemaMap(this.map);
  }

  registerStatus(parser: SchemaParser, ...codes: StatusCode[]) {
    codes.forEach((code) => {
      this.map.set(code, parser);
    });
  }

  registerRange(parser: SchemaParser, from: StatusCode, to: StatusCode) {
    for (let code = from; code <= to; code++) {
      this.map.set(code as StatusCode, parser);
    }
  }

  validate(status: StatusCode, data: unknown, requireSchema: boolean) {
    const parser = this.getParser(status, requireSchema);
    if (!parser) {
      return data;
    }
    if (typeof parser === "function") {
      return parser(data);
    }
    if ("parse" in parser) {
      return parser.parse(data);
    }
    if ("validate" in parser) {
      return parser.validate(data);
    }
    return data;
  }

  getParser(status: StatusCode, requireSchema: boolean) {
    const parser = this.map.get(status);
    if (!parser && requireSchema) {
      throw new Error(
        `No schema parser registered for status code ${status} while requireSchema is true.`
      );
    }
    return parser ?? null;
  }

  toObject() {
    return Object.fromEntries(this.map) as Record<StatusCode, SchemaParser>;
  }
}
