import { Fixture, LIFE_CYCLE } from "@autometa/app";
import { HTTPRequestBuilder, RequestHook, ResponseHook } from "./http.builder";
import { SchemaMap } from "./schema.map";
import { SchemaParser, StatusCode } from "./types";
@Fixture(LIFE_CYCLE.Transient)
export class HTTP {
  #url: string;
  #route: string[] = [];
  #headers = new Map<string, string>();
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

  shareSchema(parser: SchemaParser, ...codes: StatusCode[]): HTTP;
  shareSchema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): HTTP;
  shareSchema(
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

  sharedHeader(name: string, value: string) {
    this.#headers.set(name, value);
    return this;
  }

  route(...route: (string | number | boolean)[]) {
    return this.builder().route(...route);
  }

  header(name: string, value: string) {
    return this.builder().header(name, value);
  }

  headers(dict: Record<string, string>) {
    return this.builder().headers(dict);
  }

  get() {
    return this.builder().get();
  }

  private builder() {
    return new HTTPRequestBuilder(this.#schemaMap)
      .url(this.#url)
      .route(...this.#route)
      .allowPlainText(this.#allowPlainText)
      .headers(Object.fromEntries(this.#headers))
      .requireSchema(this.#requireSchema)
      .onBeforeSend((state) => {
        this.#onBeforeSend.forEach((it) => it(state));
      })
      .onReceivedResponse((state) => {
        this.#onAfterSend.forEach((it) => it(state));
      });
  }
}
