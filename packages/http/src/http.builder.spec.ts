import { HTTPRequestBuilder } from "./http.builder";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SchemaMap } from "./schema.map";

beforeEach(() => {
  vi.clearAllMocks();
});
vi.mock("axios", async () => {

  const mockAxios = {
    default: vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: "OK"  })
  };

  return mockAxios;
});
const map = new SchemaMap();
describe("HTTPBuilder", () => {
  it("should add a url", () => {
    const builder = new HTTPRequestBuilder(map);
    builder.url("http://localhost:3000");
    expect(builder.currentState.url).toEqual("http://localhost:3000");
  });

  it("should add a route", () => {
    const builder = new HTTPRequestBuilder(map);
    builder.route("foo", "bar");
    expect(builder.currentState.route).toEqual(["foo", "bar"]);
  });

  it("should add a header", () => {
    const builder = new HTTPRequestBuilder(map);
    builder.header("foo", "bar");
    const headers = Object.fromEntries(builder.currentState.headers);
    expect(headers).toEqual({ foo: "bar" });
  });

  it("should add a param", () => {
    const builder = new HTTPRequestBuilder(map);
    builder.param("foo", "bar");
    const params = Object.fromEntries(builder.currentState.params);
    expect(params).toEqual({ foo: "bar" });
  });

  describe("pre request hook", () => {
    it("should run the pre request hook", () => {
      const hook = vi.fn();
      new HTTPRequestBuilder(map).url("").onBeforeSend(hook).get();
      expect(hook).toHaveBeenCalled();
    });
    it("should throw if a hook fails", async () => {
      const hook = vi.fn().mockImplementation(() => {
        throw new Error("foo");
      });
      await expect(() =>
        new HTTPRequestBuilder(map).url("").onBeforeSend(hook).get()
      ).rejects.toThrow();
    });
  });

  describe("post request hook", () => {
    it("should run the post request hook", async () => {
      const hook = vi.fn();
      await new HTTPRequestBuilder(map).url("foo").onReceivedResponse(hook).get();
      expect(hook).toHaveBeenCalled();
    });
    it("should throw if a hook fails", async () => {
      const hook = vi.fn().mockImplementation(() => {
        throw new Error("foo");
      });
      await expect(() =>
        new HTTPRequestBuilder(map).url("").onReceivedResponse(hook).get()
      ).rejects.toThrow();
    });
  });
});

