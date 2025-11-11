import { SchemaMap } from "./schema.map";
import type {
  HTTPAdditionalOptions,
  RequestHook,
  ResponseHook,
  SchemaParser,
  StatusCode,
} from "./types";

export interface SchemaConfig {
  schemas: SchemaMap;
  requireSchema: boolean;
  allowPlainText: boolean;
}

export interface HTTPHooks {
  onSend: [string, RequestHook][];
  onReceive: [string, ResponseHook<unknown>][];
}

export class MetaConfig implements SchemaConfig, HTTPHooks {
  schemas: SchemaMap = new SchemaMap();
  requireSchema = false;
  allowPlainText = false;
  onSend: [string, RequestHook][] = [];
  onReceive: [string, ResponseHook<unknown>][] = [];
  throwOnServerError = false;
  options: HTTPAdditionalOptions<unknown> = {};

  constructor(init?: Partial<MetaConfig>) {
    Object.assign(this, init);
  }
}

export class MetaConfigBuilder {
  private schemaMapValue = new SchemaMap();
  private requireSchemaValue = false;
  private allowPlainTextValue = false;
  private onBeforeSendHooks: [string, RequestHook][] = [];
  private onAfterReceiveHooks: [string, ResponseHook<unknown>][] = [];
  private throwOnServerErrorValue = false;
  private optionsValue: HTTPAdditionalOptions<unknown> = {};

  merge(builder: MetaConfigBuilder) {
    this.schemaMapValue = builder.schemaMapValue.derive();
    this.requireSchemaValue = builder.requireSchemaValue;
    this.allowPlainTextValue = builder.allowPlainTextValue;
    this.onBeforeSendHooks = [...builder.onBeforeSendHooks];
    this.onAfterReceiveHooks = [...builder.onAfterReceiveHooks];
    this.throwOnServerErrorValue = builder.throwOnServerErrorValue;
    this.optionsValue = { ...builder.optionsValue };
    return this;
  }

  schemaMap(map: SchemaMap) {
    this.schemaMapValue = map;
    return this;
  }

  schema(parser: SchemaParser, ...codes: StatusCode[]): MetaConfigBuilder;
  schema(
    parser: SchemaParser,
    ...ranges: { from: StatusCode; to: StatusCode }[]
  ): MetaConfigBuilder;
  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ): MetaConfigBuilder {
    args.forEach((arg) => {
      if (typeof arg === "number") {
        this.schemaMapValue.registerStatus(parser, arg);
        return;
      }
      if (Array.isArray(arg)) {
        this.schemaMapValue.registerStatus(parser, ...arg);
        return;
      }
      this.schemaMapValue.registerRange(parser, arg.from, arg.to);
    });
    return this;
  }

  requireSchema(value: boolean) {
    this.requireSchemaValue = value;
    return this;
  }

  allowPlainText(value: boolean) {
    this.allowPlainTextValue = value;
    return this;
  }

  onBeforeSend(description: string, hook: RequestHook) {
    this.onBeforeSendHooks.push([description, hook]);
    return this;
  }

  onReceiveResponse(description: string, hook: ResponseHook<unknown>) {
    this.onAfterReceiveHooks.push([description, hook]);
    return this;
  }

  throwOnServerError(value: boolean) {
    this.throwOnServerErrorValue = value;
    return this;
  }

  options(options: HTTPAdditionalOptions<unknown>) {
    this.optionsValue = mergeOptions(this.optionsValue, options);
    return this;
  }

  build() {
    return new MetaConfig({
      schemas: this.schemaMapValue.derive(),
      requireSchema: this.requireSchemaValue,
      allowPlainText: this.allowPlainTextValue,
      onSend: [...this.onBeforeSendHooks],
      onReceive: [...this.onAfterReceiveHooks],
      options: { ...this.optionsValue },
      throwOnServerError: this.throwOnServerErrorValue,
    });
  }

  derive() {
    return new MetaConfigBuilder()
      .schemaMap(this.schemaMapValue.derive())
      .requireSchema(this.requireSchemaValue)
      .allowPlainText(this.allowPlainTextValue)
      .throwOnServerError(this.throwOnServerErrorValue)
      .options(this.optionsValue)
      .setOnBeforeSend(this.onBeforeSendHooks)
      .setOnAfterReceive(this.onAfterReceiveHooks);
  }

  private setOnBeforeSend(hooks: [string, RequestHook][]) {
    this.onBeforeSendHooks = [...hooks];
    return this;
  }

  private setOnAfterReceive(hooks: [string, ResponseHook<unknown>][]) {
    this.onAfterReceiveHooks = [...hooks];
    return this;
  }
}

function mergeOptions(
  target: HTTPAdditionalOptions<unknown>,
  updates: HTTPAdditionalOptions<unknown>
) {
  const next = { ...target } as Record<string, unknown>;
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next as HTTPAdditionalOptions<unknown>;
}
