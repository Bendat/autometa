import { Fixture, INJECTION_SCOPE } from "@autometa/injection";
import { HTTPRequestBuilder } from "./http.builder";
import { SchemaMap } from "./schema.map";
import { RequestHook, ResponseHook, SchemaParser, StatusCode } from "./types";
export type DynamicHeader = () => string;
@Fixture(INJECTION_SCOPE.TRANSIENT)
export class HTTP {
  #url: string;
  #route: string[] = [];
  #headers = new Map<string, string | DynamicHeader>();
  #requireSchema = false;
  #schemaMap: SchemaMap = new SchemaMap();
  #onBeforeSend: RequestHook[] = [];
  #onAfterSend: ResponseHook<unknown>[] = [];
  #allowPlainText = false;

  allowPlainText(value: boolean) {
    this.#allowPlainText = value;
    return this;
  }
  requireSchema(value: boolean) {
    this.#requireSchema = value;
    return this;
  }

  url(url: string) {
    this.#url = url;
    return this;
  }

  sharedOnBeforeSend(hook: RequestHook) {
    this.#onBeforeSend.push(hook);
    return this;
  }

  sharedOnReceiveResponse(hook: ResponseHook<unknown>) {
    this.#onAfterSend.push(hook);
    return this;
  }

  onBeforeSend(hook: RequestHook) {
    return this.builder().onBeforeSend(hook);
  }

  onReceiveResponse(hook: ResponseHook<unknown>) {
    return this.builder().onReceivedResponse(hook);
  }

  sharedSchema(parser: SchemaParser, ...codes: StatusCode[]): HTTP;
  sharedSchema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): HTTP;
  sharedSchema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.#schemaMap.register(parser, ...(args as any));
    return this;
  }

  schema(parser: SchemaParser, ...codes: StatusCode[]): HTTPRequestBuilder;
  schema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): HTTPRequestBuilder;
  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.builder().schema(parser, ...(args as any));
  }

  sharedRoute(...route: string[]) {
    this.#route.push(...route);
    return this;
  }

  param(name: string, value: string) {
    return this.builder().param(name, value);
  }

  params(dict: Record<string, string>) {
    return this.builder().params(dict);
  }

  data<T>(data: T) {
    return this.builder().data(data);
  }

  sharedHeader(name: string, value: string | DynamicHeader) {
    this.#headers.set(name, value);
    return this;
  }

  route(...route: (string | number | boolean)[]) {
    return this.builder().route(...route);
  }

  header<T>(name: string, value: T) {
    return this.builder().header(name, value);
  }

  headers(dict: Record<string, string>) {
    return this.builder().headers(dict);
  }

  get() {
    return this.builder().get();
  }

  private builder() {
    const headers = this.convertFactoriesToString();
    return new HTTPRequestBuilder(this.#schemaMap)
      .url(this.#url)
      .route(...this.#route)
      .allowPlainText(this.#allowPlainText)
      .headers(headers)
      .requireSchema(this.#requireSchema)
      .onBeforeSend(...this.#onBeforeSend)
      .onReceivedResponse(...this.#onAfterSend);
  }

  private convertFactoriesToString() {
    const dict: Record<string, string> = {};
    for (const [key, value] of this.#headers.entries()) {
      dict[key] = typeof value === "string" ? value : value();
    }
    return dict;
  }
}
