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

  it("returns the same cached proxy when called multiple times", () => {
    const target = new Fixture();
    const first = withAccessTracking(target);
    const second = withAccessTracking(target);
    expect(first).toBe(second);
  });

  it("supports disabling suggestions", () => {
    const fixture = withAccessTracking(new Fixture(), { suggestClosest: false });
    expect(() => (fixture as Fixture & { hostnmae: string }).hostnmae).not.toThrow(/Did you mean/);
  });

  it("supports a custom violation message formatter", () => {
    const fixture = withAccessTracking(new Fixture(), {
      suggestClosest: false,
      formatMessage: ({ property }) => `Custom message for ${String(property)}`,
    });
    expect(() => (fixture as Fixture & { hostnmae: string }).hostnmae).toThrow(
      "Custom message for hostnmae"
    );
  });

  it("records writes for previously unseen keys", () => {
    const fixture = withAccessTracking(new Fixture(), { allow: ["host"] });
    (fixture as Fixture & { protocol?: string }).protocol = "https";
    expect(getAccessDiagnostics(fixture)?.writes.get("protocol")).toEqual(["https"]);
  });

  it("does not include suggestions when there are no candidate keys", () => {
    const fixture = withAccessTracking({} as { foo?: string });
    expect(() => (fixture as { bar: string }).bar).not.toThrow(/Did you mean/);
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
