import { describe, expect, it } from "vitest";
import { AutomationError } from "../automation-error";
import {
  formatErrorCauses,
  formatErrorTree,
  printErrorTree,
} from "../formatter";

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

  it("falls back when stack is missing", () => {
    const error = new AutomationError("Root");
    Object.defineProperty(error, "stack", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: undefined,
    });

    const output = formatErrorCauses(error, { includeStack: true });
    expect(output).toContain("<no stack trace available>");
  });

  it("describes strings and unserialisable values", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const stringCause = new AutomationError("Root", { cause: "stringy" });
    const circularCause = new AutomationError("Root", { cause: circular });

    const stringOutput = formatErrorCauses(stringCause, { includeStack: false });
    const circularOutput = formatErrorCauses(circularCause, { includeStack: false });

    expect(stringOutput).toContain("stringy");
    expect(circularOutput).toContain("[object Object]");
  });
});

describe("formatErrorTree", () => {
  it("renders an indented bullet list for error causes", () => {
    const deep = new AutomationError("Deep");
    const inner = new AutomationError("Inner", { cause: deep });
    const root = new AutomationError("Root", { cause: inner });

    const output = formatErrorTree(root, { includeStack: false });
    const lines = output.split("\n");

    expect(lines).toEqual([
      "• AutomationError: Root",
      "  • AutomationError: Inner",
      "    • AutomationError: Deep",
    ]);
  });

  it("includes described non-error causes", () => {
    const root = new AutomationError("Root", { cause: { type: "context" } });

    const output = formatErrorTree(root, {
      includeStack: false,
      describeValue: (value) => `details:${(value as { type: string }).type}`,
    });

    expect(output.split("\n")[1]).toBe("  • details:context");
  });

  it("appends notices for max depth and cycles", () => {
    const other = new AutomationError("Other");
    const root = new AutomationError("Root", { cause: other });
    Object.defineProperty(other, "cause", {
      configurable: true,
      enumerable: false,
      value: root,
    });

    const output = formatErrorTree(root, {
      includeStack: false,
      maxDepth: 0,
    });

    expect(output.split("\n")[1]).toBe("  • [max depth reached]");

    const cycleOutput = formatErrorTree(root, { includeStack: false });
    expect(cycleOutput).toContain("cycle detected");
  });

  it("supports custom bullets and indent", () => {
    const child = new AutomationError("Child");
    const parent = new AutomationError("Parent", { cause: child });

    const output = formatErrorTree(parent, {
      includeStack: false,
      bullet: "-",
      indent: "    ",
    });

    expect(output.split("\n")).toEqual([
      "- AutomationError: Parent",
      "    - AutomationError: Child",
    ]);
  });

  it("prints using the provided writer", () => {
    const logs: string[] = [];
    const error = new AutomationError("Root");

    printErrorTree(error, {
      includeStack: false,
      writer: (line) => logs.push(line),
    });

    expect(logs).toEqual(["• AutomationError: Root"]);
  });

  it("renders multiline content with stack traces", () => {
    const error = new AutomationError("Root");
    Object.defineProperty(error, "stack", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: "Error: Root\nfirst line\nsecond line",
    });

    const output = formatErrorTree(error, { includeStack: true });
    const lines = output.split("\n");

    expect(lines.length).toBeGreaterThan(2);
    expect(lines[0]).toBe("• AutomationError: Root");
    expect(lines[1]).toBe("  Stacktrace:");
    expect(lines[2]).toBe("  Error: Root");
  });
});
