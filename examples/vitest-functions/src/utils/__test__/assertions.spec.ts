import { describe, it, expect, vi } from "vitest";
import { requireResponse, toPathExpectations, brewBuddyPlugins } from "../assertions";
import type { BrewBuddyWorld } from "../../world";
import type { HTTPResponse } from "@autometa/http";

describe("assertions utils", () => {
  describe("requireResponse", () => {
    it("returns lastResponse if present", () => {
      const response = {} as HTTPResponse<unknown>;
      const world = { app: { lastResponse: response } } as BrewBuddyWorld;
      expect(requireResponse(world)).toBe(response);
    });

    it("throws if lastResponse is missing", () => {
      const world = { app: { lastResponse: undefined } } as unknown as BrewBuddyWorld;
      expect(() => requireResponse(world)).toThrow("No HTTP response recorded");
    });
  });

  describe("toPathExpectations", () => {
    it("converts table records to expectations", () => {
      const records = [
        { path: "a.b", value: "123" },
        { path: "c", value: "true" },
      ];
      const expectations = toPathExpectations(records);
      expect(expectations).toEqual([
        { path: "a.b", value: 123 },
        { path: "c", value: true },
      ]);
    });

    it("throws if path is missing", () => {
      const records = [{ value: "123" }];
      expect(() => toPathExpectations(records)).toThrow('missing a "path" column');
    });

    it("throws if path is empty", () => {
      const records = [{ path: "   ", value: "123" }];
      expect(() => toPathExpectations(records)).toThrow('contains an empty "path" value');
    });
  });

  describe("brewBuddyPlugins", () => {
    describe("json", () => {
      it("validates json paths", () => {
        const ensureMock = Object.assign(
          vi.fn().mockReturnValue({
            toBeDefined: vi.fn().mockReturnThis(),
            value: { a: 1, b: "test" },
            toEqual: vi.fn(),
            toStrictEqual: vi.fn(),
            toBeTruthy: vi.fn(),
            toBeInstanceOf: vi.fn().mockReturnThis(),
          }),
          {
            always: vi.fn().mockReturnValue({
              toBeDefined: vi.fn().mockReturnThis(),
              value: { a: 1, b: "test" },
            }),
          }
        );
        
        const world = { app: { lastResponseBody: { a: 1, b: "test" } } } as unknown as BrewBuddyWorld;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const plugin = brewBuddyPlugins.json({ ensure: ensureMock as any, isNot: false });
        const assertions = plugin(world);

        assertions.contains([{ path: "a", value: 1 }]);

        expect(ensureMock).toHaveBeenCalled();
      });

      it("validates timestamp placeholder", () => {
        const ensureMock = Object.assign(
          vi.fn().mockReturnValue({
            toBeDefined: vi.fn().mockReturnThis(),
            value: { created: "2023-01-01" },
            toStrictEqual: vi.fn(),
            toBeTruthy: vi.fn(),
            toEqual: vi.fn(),
            toBeInstanceOf: vi.fn().mockReturnThis(),
          }),
          {
            always: vi.fn().mockReturnValue({
              toBeDefined: vi.fn().mockReturnThis(),
              value: { created: "2023-01-01" },
            }),
          }
        );

        const world = { app: { lastResponseBody: { created: "2023-01-01" } } } as unknown as BrewBuddyWorld;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const plugin = brewBuddyPlugins.json({ ensure: ensureMock as any, isNot: false });
        const assertions = plugin(world);

        assertions.contains([{ path: "created", value: { __placeholder: "timestamp" } }]);

        expect(ensureMock).toHaveBeenCalled();
      });
    });
  });
});
