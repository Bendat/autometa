import { describe, it, expect, vi } from "vitest";
import { BeforeHook } from "./hook";
import { Seconds, Timeout } from "./timeout";
import { isTagsMatch } from "@autometa/gherkin";
describe("hook", () => {
  it("should return true if the hook can execute a provided tag expression", () => {
    const hook = new BeforeHook(
      "foo",
      vi.fn(),
      new Seconds(1000),
      "@foo and @bar"
    );
    expect(hook.canFilter).toBe(true);
    const filter = "@foo and @bar";
    expect(isTagsMatch(["@foo", "@bar"], "@foo and @bar")).toBe(true);
    expect(hook.canExecute("@foo", "@bar")).toBe(true);
  });

  it("should return false if the hook cannot execute a provided tag expression", () => {
    const hook = new BeforeHook("foo", vi.fn(), new Seconds(1000), "foo");
    expect(hook.canFilter).toBe(true);
    const filter = "@foo and @bar";
    expect(hook.canExecute(filter)).toBe(true);
  });
});
