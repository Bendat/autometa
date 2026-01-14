import { describe, expect, it } from "vitest";
import { overloads, def, fallback } from "../authoring/overloads";
import { literal, string, number } from "../validators/primitives";
import { shape, tuple } from "../validators/composite";

describe("Scenario: command dispatch", () => {
  const dispatch = overloads(
    def("status command", literal("status")).match(() => ({ message: "All systems nominal" })),
    def`configure command`(
      { description: "command plus payload" },
      literal("set"),
      shape({
        target: literal(["threshold", "timeout"]),
        value: number({ min: 0 }),
      })
    ).match((command, payload) => {
      const typedCommand = command as string;
      const typedPayload = payload as { target: "threshold" | "timeout"; value: number };
      return {
        message: `${typedCommand} ${typedPayload.target} to ${typedPayload.value}`,
      };
    }),
    def("tuple command", tuple([literal("log"), string({ optional: true })], { allowExtra: false })).match((entry) => {
      const [command, channel] = entry as ["log", string | undefined];
      return {
        message: `${command} command accepted${channel ? ` for ${channel}` : ""}`,
      };
    }),
    def("self destruct", literal("self-destruct")).throws(Error, "Self destruct initiated"),
    fallback("unknown command", (...args) => ({ error: "Unknown command", received: args })),
  );

  it("handles simple literal commands", () => {
    const result = dispatch.use(["status"]);
    expect(result).toEqual({ message: "All systems nominal" });
  });

  it("handles commands with structured payloads", () => {
    const result = dispatch.use(["set", { target: "threshold", value: 5 }]);
    expect(result).toEqual({ message: "set threshold to 5" });
  });

  it("accepts tuple-based commands", () => {
    const result = dispatch.use([["log", "audit"]]);
    expect(result).toEqual({ message: "log command accepted for audit" });

    const resultWithoutChannel = dispatch.use([["log"]]);
    expect(resultWithoutChannel).toEqual({ message: "log command accepted" });
  });

  it("throws for commands marked with throws", () => {
    expect(() => dispatch.use(["self-destruct"])).toThrowError(new Error("Self destruct initiated"));
  });

  it("falls back for unknown commands", () => {
    const result = dispatch.use(["ping", { payload: true }]);
    expect(result).toEqual({ error: "Unknown command", received: ["ping", { payload: true }] });
  });
});
