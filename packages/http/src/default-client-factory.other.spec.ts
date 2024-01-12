import { describe, it, expect, vi } from "vitest";
import { defaultClientFactory } from "./default-client-factory";
import { HTTPClient } from "./http-client";
describe("default client as Axios", () => {
  @HTTPClient.Use()
  class TestHTTPClient extends HTTPClient {
    request = vi.fn();
  }
  it("should be an Axios client", () => {
    const client = defaultClientFactory();
    expect(client).instanceOf(TestHTTPClient);
  });
});
