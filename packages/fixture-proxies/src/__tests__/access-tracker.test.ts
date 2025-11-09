import { describe, expect, it } from "vitest";
import {
  getAccessDiagnostics,
  getAssignedValues,
  getReadCount,
  withAccessTracking,
} from "../access-tracker.js";

class Fixture {
  host: string | undefined = undefined;
  port = 8080;
}

describe("withAccessTracking", () => {
  it("records reads and writes", () => {
    const fixture = withAccessTracking(new Fixture(), {
      allow: ["host"],
    });

    expect(getReadCount(fixture, "port")).toBe(1); // initial read during setup
    expect(getAssignedValues(fixture, "port")).toEqual([8080]);

    // read/write
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    fixture.port;
    fixture.port = 9090;

    expect(getReadCount(fixture, "port")).toBe(2);
    expect(getAssignedValues(fixture, "port")).toEqual([8080, 9090]);
  });

  it("throws automation error with suggestions for unknown properties", () => {
    const fixture = withAccessTracking(new Fixture());

    expect(() => (fixture as Fixture & { hostnmae: string }).hostnmae).toThrow(
      /Did you mean:[\s\S]*host/
    );
  });

  it("supports custom violation handlers", () => {
    const fixture = withAccessTracking(new Fixture(), {
      onViolation({ property }) {
        throw new Error(`Custom: ${String(property)}`);
      },
    });

    expect(() => (fixture as Fixture & { db: string }).db).toThrow(
      /Custom: db/
    );
  });

  it("provides diagnostics via helper", () => {
    const fixture = withAccessTracking(new Fixture());
    fixture.host = "localhost";
    const diagnostics = getAccessDiagnostics(fixture);
    expect(diagnostics).toBeDefined();
    expect(diagnostics?.writes.get("host")).toEqual(["localhost"]);
  });
});
