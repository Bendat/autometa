import { AfterHook, BeforeHook, SetupHook, TeardownHook } from "../hook";
import { describe, it, expect, vi } from "vitest";
import { HookCache } from "./hook-cache";

describe("hook-cache", () => {
  describe("addHook", () => {
    it("should add a BeforeHook to the before property", () => {
      const hookCache = new HookCache();
      const hook = new BeforeHook("test", vi.fn());
      hookCache.addHook(hook);
      expect(hookCache.before).toContain(hook);
    });
    it("should add a SetupHook to the setup property", () => {
      const hookCache = new HookCache();
      const hook = new SetupHook("test", vi.fn());
      hookCache.addHook(hook);
      expect(hookCache.setup).toContain(hook);
    });
    it("should add a AfterHook to the after property", () => {
      const hookCache = new HookCache();
      const hook = new AfterHook("test", vi.fn());
      hookCache.addHook(hook);
      expect(hookCache.after).toContain(hook);
    });
    it("should add a TeardownHook to the teardown property", () => {
      const hookCache = new HookCache();
      const hook = new TeardownHook("test", vi.fn());
      hookCache.addHook(hook);
      expect(hookCache.teardown).toContain(hook);
    });
    it("should throw an error if the hook is not recognized", () => {
      const hookCache = new HookCache();
      const hook = {
        name: "test",
        action: vi.fn(),
      };
      expect(() => hookCache.addHook(hook)).toThrowError("unrecognized hook");
    });
  });
});
