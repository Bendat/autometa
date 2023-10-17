import { HTTPRequestBuilder } from "./http.builder";
import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn()
}));

beforeEach(() => {
  vi.clearAllMocks();
});
vi.mock("axios", async (importActual) => {
  const actual = await importActual<typeof import("axios")>();

  const mockAxios = {
    default: vi.fn()
  };

  return mockAxios;
});
describe("HTTPBuilder", () => {
  it("should add a url", () => {
    const builder = new HTTPRequestBuilder();
    builder.url("http://localhost:3000");
    expect(builder.currentState.url).toEqual("http://localhost:3000");
  });

  it("should add a route", () => {
    const builder = new HTTPRequestBuilder();
    builder.route("foo", "bar");
    expect(builder.currentState.route).toEqual(["foo", "bar"]);
  });

  it("should add a header", () => {
    const builder = new HTTPRequestBuilder();
    builder.header("foo", "bar");
    const headers = Object.fromEntries(builder.currentState.headers);
    expect(headers).toEqual({ foo: "bar" });
  });

  it("should add a param", () => {
    const builder = new HTTPRequestBuilder();
    builder.param("foo", "bar");
    const params = Object.fromEntries(builder.currentState.params);
    expect(params).toEqual({ foo: "bar" });
  });

  describe("pre request hook", () => {
    it("should run the pre request hook", () => {
      const hook = vi.fn();
      new HTTPRequestBuilder().url("").onBeforeSend(hook).get();
      expect(hook).toHaveBeenCalled();
    });
    it("should throw if a hook fails", async () => {
      const hook = vi.fn().mockImplementation(() => {
        throw new Error("foo");
      });
      await expect(() =>
        new HTTPRequestBuilder().url("").onBeforeSend(hook).get()
      ).rejects.toThrow();
    });
  });

  describe("post request hook", () => {
    it("should run the post request hook", async () => {
      const hook = vi.fn();
      await new HTTPRequestBuilder().url("").onReceiveResponse(hook).get();
      expect(hook).toHaveBeenCalled();
    });
    it("should throw if a hook fails", async () => {
      const hook = vi.fn().mockImplementation(() => {
        throw new Error("foo");
      });
      await expect(() =>
        new HTTPRequestBuilder().url("").onReceiveResponse(hook).get()
      ).rejects.toThrow();
    });
  });
});
