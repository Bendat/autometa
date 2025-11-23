import { describe, expect, it } from "vitest";
import * as index from "../index";

describe("Index Exports", () => {
  it("exports expected members", () => {
    expect(index.HTTP).toBeDefined();
    expect(index.HTTPRequest).toBeDefined();
    expect(index.HTTPResponse).toBeDefined();
    expect(index.createFetchTransport).toBeDefined();
    expect(index.createAxiosTransport).toBeDefined();
    expect(index.createLoggingPlugin).toBeDefined();
    expect(index.MetaConfig).toBeDefined();
    expect(index.SchemaMap).toBeDefined();
    expect(index.AnySchema).toBeDefined();
    expect(index.transformResponse).toBeDefined();
  });
});
