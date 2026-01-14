import { describe, expect, it } from "vitest";

import { buildFailureMessage, formatDiff, formatMissingList } from "../messages";

describe("messages helpers", () => {
  it("builds failure message with expected sections", () => {
    const message = buildFailureMessage(
      "toBe",
      "Values differ",
      {
        expected: { id: 1 },
        actual: { id: 2 },
        extra: ["Additional info"],
        diff: "- 1\n+ 2",
      }
    );

    expect(message).toContain("ensure(received).toBe(expected)");
    expect(message).toContain("Values differ");
    expect(message).toContain("Expected:");
    expect(message).toContain("Received:");
    expect(message).toContain("Additional info");
    expect(message).toContain("- 1");
  });

  it("skips diff when not provided", () => {
    const message = buildFailureMessage("toBe", "Values differ");
    expect(message).not.toContain("- ");
  });

  it("formats diffs using jest-diff", () => {
    const diff = formatDiff({ id: 1 }, { id: 2 });
    expect(diff).toContain("id");
  });

  it("formats missing list", () => {
    const formatted = formatMissingList("Missing", [1, 2]);
    const esc = String.fromCharCode(27);
    const ansi = new RegExp(`${esc}\\[[0-9;]*m`, "g");
    const stripped = formatted.replace(ansi, "");
    expect(stripped).toContain("Missing");
    expect(stripped).toContain("- 1");
    expect(stripped).toContain("- 2");
  });
});
