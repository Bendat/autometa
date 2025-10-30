import { describe, expect, it } from "vitest";
import { AutomationError } from "../automation-error";
import { formatErrorCauses } from "../formatter";

describe("formatErrorCauses", () => {
  it("includes the root error details", () => {
    const error = new AutomationError("Root fail");
    const output = formatErrorCauses(error);
    expect(output).toContain("AutomationError: Root fail");
  });

  it("renders nested causes", () => {
    const leaf = new Error("Leaf");
    const inner = new AutomationError("Inner", { cause: leaf });
    const root = new AutomationError("Root", { cause: inner });

    const output = formatErrorCauses(root);

    expect(output).toContain("AutomationError: Root");
    expect(output).toContain("AutomationError: Inner");
    expect(output).toContain("Error: Leaf");
  });

  it("describes non-error causes", () => {
    const root = new AutomationError("Root", { cause: { message: "plain" } });
    const output = formatErrorCauses(root);
    expect(output).toContain('{"message":"plain"}');
  });

  it("honours maxDepth option", () => {
    const third = new AutomationError("Third");
    const second = new AutomationError("Second", { cause: third });
    const first = new AutomationError("First", { cause: second });

    const output = formatErrorCauses(first, { maxDepth: 1, includeStack: false });
    expect(output).toContain("AutomationError: First");
    expect(output).toContain("AutomationError: Second");
    expect(output).not.toContain("Third");
    expect(output).toContain("[max depth reached]");
  });

  it("supports custom describeValue", () => {
    const root = new AutomationError("Root", { cause: { id: 1 } });
    const output = formatErrorCauses(root, {
      includeStack: false,
      describeValue: (value) => `value:${(value as { id: number }).id}`,
    });

    expect(output).toContain("value:1");
  });

  it("guards against cyclic cause references", () => {
    const first = new AutomationError("First");
    const second = new AutomationError("Second", { cause: first });
    Object.defineProperty(first, "cause", {
      configurable: true,
      enumerable: false,
      value: second,
    });

    const output = formatErrorCauses(second);
    expect(output).toContain("cycle detected");
  });
});
