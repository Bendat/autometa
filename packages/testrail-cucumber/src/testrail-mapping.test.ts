import { describe, expect, it } from "vitest";

import { ensureRefsContain, extractSignatureFromRefs } from "./testrail-mapping";

describe("testrail-mapping", () => {
  it("extractSignatureFromRefs finds an autometa signature", () => {
    const sig = "autometa:" + "a".repeat(64);
    expect(extractSignatureFromRefs(`ABC-123 ${sig} XYZ-1`)).toBe(sig);
  });

  it("ensureRefsContain appends token without duplicates", () => {
    const out1 = ensureRefsContain("ABC-1", "autometa:deadbeef" + "0".repeat(56));
    expect(out1).toContain("ABC-1");
    expect(out1).toContain("autometa:");

    const out2 = ensureRefsContain(out1, "ABC-1");
    // Set semantics => only one ABC-1
    expect(out2.split(/\s+/).filter((x) => x === "ABC-1").length).toBe(1);
  });
});
