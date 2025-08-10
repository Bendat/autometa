import { describe, it, expect } from "vitest";
import { Fixture } from "./fixture";
import { INJECTION_SCOPE } from "./scope.enum";
import { getScope } from "./metadata-registry";

describe("fixture", () => {
  @Fixture
  class AutoCachedClass {}
  @Fixture(INJECTION_SCOPE.TRANSIENT)
  class OnceClass {}
  @Fixture(INJECTION_SCOPE.SINGLETON)
  class SingletonClass {}

  it("should default to cached if not specified", () => {
    const scope = getScope(AutoCachedClass);
    expect(scope).toBe(INJECTION_SCOPE.CACHED);
  });

  it("should be a singleton if specified", () => {
    const scope = getScope(SingletonClass);
    expect(scope).toBe(INJECTION_SCOPE.SINGLETON);
  });

  it("should be transient if specified", () => {
    const scope = getScope(OnceClass);
    expect(scope).toBe(INJECTION_SCOPE.TRANSIENT);
  });
});
