import { describe, expect, it } from "vitest";
import { getTimeout } from "./timeout-selector";
import { NullTimeout, TimedScope, Timeout } from "@autometa/scopes";
import { Config } from "@autometa/config";

describe("getTimeout", () => {
  it("should use the timeout defined in the scope and no config should be defined", () => {
    const target: TimedScope = {
      timeout: Timeout.from(1000)
    };
    const config = new Config(new Map());
    const result = getTimeout(target.timeout, config);
    expect(result).toBe(target.timeout);
  });

  it("should use the timout defined in config and no timeout in the scope", () => {
    const target: TimedScope = {
      timeout: new NullTimeout(0)
    };
    const map = new Map();
    map.set("default", {
      test: {
        timeout: [1, "s"]
      }
    });
    const config = new Config(map);
    const result = getTimeout(target.timeout, config);
    expect(result).toEqual(Timeout.from([1, "s"]));
  });
});
