import { SchemaMap } from "./schema.map";
import { RequestHook, ResponseHook, SchemaParser, StatusCode } from "./types";

export interface SchemaConfig {
  schemas: SchemaMap;
  requireSchema: boolean;
  allowPlainText: boolean;
}

export interface HTTPHooks {
  onSend: [string, RequestHook][];
  onReceive: [string, ResponseHook<unknown>][];
}

// export type MetaConfig = SchemaConfig & HTTPHooks;

export class MetaConfig implements SchemaConfig, HTTPHooks {
  schemas: SchemaMap;
  requireSchema: boolean;
  allowPlainText: boolean;
  onSend: [string, RequestHook][] = [];
  onReceive: [string, ResponseHook<unknown>][] = [];
  throwOnServerError: boolean;
}

export class MetaConfigBuilder {
  #schemaMap = new SchemaMap();
  #requireSchema = false;
  #allowPlainText = false;
  #onBeforeSend: [string, RequestHook][] = [];
  #onAfterSend: [string, ResponseHook<unknown>][] = [];
  #throwOnServerError = false;

  schemaMap(map: SchemaMap) {
    this.#schemaMap = map;
    return this;
  }

  schema(parser: SchemaParser, ...codes: StatusCode[]): MetaConfigBuilder;
  schema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): MetaConfigBuilder;
  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ): MetaConfigBuilder;
  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    args.forEach((arg) => {
      if (typeof arg === "number") {
        this.#schemaMap.registerStatus(parser, arg);
      } else if (Array.isArray(arg)) {
        this.#schemaMap.registerStatus(parser, ...arg);
      } else {
        this.#schemaMap.registerRange(parser, arg.from, arg.to);
      }
    });

    return this;
  }

  requireSchema(value: boolean) {
    this.#requireSchema = value;
    return this;
  }

  allowPlainText(value: boolean) {
    this.#allowPlainText = value;
    return this;
  }

  onBeforeSend(description: string, hook: RequestHook) {
    this.#onBeforeSend.push([description, hook]);
    return this;
  }

  #setOnSend(hooks: [string, RequestHook][]) {
    this.#onBeforeSend = [...hooks];
    return this;
  }

  throwOnServerError(value: boolean) {
    this.#throwOnServerError = value;
    return this;
  }

  onReceiveResponse(description: string, hook: ResponseHook<unknown>) {
    this.#onAfterSend.push([description, hook]);
    return this;
  }

  #setOnReceive(hooks: [string, ResponseHook<unknown>][]) {
    this.#onAfterSend = [...hooks];
    return this;
  }

  build() {
    const config = new MetaConfig();
    config.schemas = this.#schemaMap.derive();
    config.requireSchema = this.#requireSchema;
    config.allowPlainText = this.#allowPlainText;
    config.onSend = this.#onBeforeSend;
    config.onReceive = this.#onAfterSend;
    return config;
  }

  derive() {
    return new MetaConfigBuilder()
      .schemaMap(this.#schemaMap.derive())
      .requireSchema(this.#requireSchema)
      .allowPlainText(this.#allowPlainText)
      .throwOnServerError(this.#throwOnServerError)
      .#setOnSend(this.#onBeforeSend)
      .#setOnReceive(this.#onAfterSend);
  }
}
