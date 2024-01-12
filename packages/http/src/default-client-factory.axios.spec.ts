import { describe, it, expect } from "vitest";
import { defaultClientFactory } from "./default-client-factory";
import { AxiosClient } from "./axios-client";
describe("default client as Axios", () => {
  it("should be an Axios client", () => {
    const client = defaultClientFactory();
    expect(client).instanceOf(AxiosClient);
  });
});
