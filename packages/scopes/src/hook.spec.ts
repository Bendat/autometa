import { describe, it, expect, vi } from "vitest";
import { Seconds } from "./timeout";
import { isTagsMatch } from "@autometa/gherkin";
import { BeforeHook } from "./hook";
describe("hook", () => {
  it("should return true if the hook can execute a provided tag expression", () => {
    const hook = new BeforeHook("foo", vi.fn())
      .tagFilter("@foo and @bar")
      .timeout(1000, "s");
    expect(hook.canFilter).toBe(true);
    expect(isTagsMatch(["@foo", "@bar"], "@foo and @bar")).toBe(true);
    expect(hook.canExecute("@foo", "@bar")).toBe(true);
  });

  it("should return false if the hook cannot execute a provided tag expression", () => {
    const hook = new BeforeHook("foo", vi.fn())
      .timeout(new Seconds(1000))
      .tagFilter("@foo and @bar");
    expect(hook.canFilter).toBe(true);
    const filter = "@foo and @bar";
    expect(hook.canExecute(filter)).toBe(false);
  });
});
