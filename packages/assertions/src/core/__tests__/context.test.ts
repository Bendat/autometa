import { describe, expect, it } from "vitest";

import { shouldFail } from "../context";

describe("shouldFail", () => {
  it("fails when matcher should pass without negation", () => {
    expect(shouldFail(true, false)).toBe(false);
    expect(shouldFail(false, false)).toBe(true);
  });

  it("inverts result when negated", () => {
    expect(shouldFail(true, true)).toBe(true);
    expect(shouldFail(false, true)).toBe(false);
  });
});
