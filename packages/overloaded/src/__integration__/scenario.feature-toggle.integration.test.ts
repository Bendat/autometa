import { describe, expect, it } from "vitest";
import { overloads, def, fallback } from "../authoring/overloads";
import { boolean, literal, string } from "../validators/primitives";
import { array, intersection, shape, union } from "../validators/composite";

type ToggleConfig = { name: string; enabled?: boolean };

describe("Scenario: feature toggle routing", () => {
  const bulkToggleValidator = union(
    [
      array(string(), { summary: "string[]" }),
      array(
        shape(
          {
            name: string(),
            enabled: boolean({ optional: true }),
          },
          { allowUnknownProperties: false }
        ),
        { summary: "ToggleConfig[]" }
      ),
    ],
    { summary: "string[] | ToggleConfig[]" }
  );

  const configValidator = intersection([
    shape({ name: string() }, { allowUnknownProperties: true }),
    shape({ enabled: boolean() }, { allowUnknownProperties: true }),
  ]);

  const dispatcher = overloads(
    def("literal toggle", literal(["enable", "disable"])).match((state) => ({
      route: "single",
      state: state as "enable" | "disable",
    })),
    def("bulk toggle", bulkToggleValidator).match((payload) => {
      const list = payload as unknown[];

      if (list.length === 0) {
        return { route: "bulk-empty" };
      }

      if (typeof list[0] === "string") {
        return { route: "bulk-names", names: list as string[] };
      }

      const typed = list as ToggleConfig[];
      return { route: "bulk-configs", configs: typed };
    }),
    def("config object", configValidator).match((config) => {
      const typed = config as { name: string; enabled: boolean };
      return {
        route: "config",
        name: typed.name,
        enabled: typed.enabled,
      };
    }),
    fallback("unsupported toggle", (...args) => ({ route: "fallback", received: args })),
  );

  it("handles literal toggles", () => {
    const result = dispatcher.use(["enable"]);
    expect(result).toEqual({ route: "single", state: "enable" });
  });

  it("supports bulk toggles using names", () => {
    const result = dispatcher.use([["alpha", "beta"]]);
    expect(result).toEqual({ route: "bulk-names", names: ["alpha", "beta"] });
  });

  it("supports bulk toggles using config objects", () => {
    const result = dispatcher.use([
      [
        { name: "alpha", enabled: true },
        { name: "beta", enabled: false },
      ],
    ]);

    expect(result).toEqual({
      route: "bulk-configs",
      configs: [
        { name: "alpha", enabled: true },
        { name: "beta", enabled: false },
      ],
    });
  });

  it("matches intersection-based config objects", () => {
    const result = dispatcher.use([{ name: "gamma", enabled: true }]);
    expect(result).toEqual({ route: "config", name: "gamma", enabled: true });
  });

  it("falls back for unknown payloads", () => {
    const result = dispatcher.use([123]);
    expect(result).toEqual({ route: "fallback", received: [123] });
  });
});
