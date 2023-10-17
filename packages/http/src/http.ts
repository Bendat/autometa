import { Fixture, LIFE_CYCLE } from "@autometa/app";
import { HTTPRequestBuilder } from "./http.builder";

@Fixture(LIFE_CYCLE.Transient)
export class HTTP {
  #url: string;
  #route: string[] = [];
  #headers = new Map<string, string>();

  url(url: string) {
    this.#url = url;
    return this;
  }

  shareRoute(...route: string[]) {
    this.#route.push(...route);
    return this;
  }

  data(data: Record<string, any>) {
    return this.builder().data(data);
  }

  sharedHeader(name: string, value: string) {
    this.#headers.set(name, value);
    return this;
  }

  route(...route: string[]) {
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
    return new HTTPRequestBuilder()
      .url(this.#url)
      .route(...this.#route)
      .headers(Object.fromEntries(this.#headers));
  }
}
