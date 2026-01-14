import { describe, expect, it, vi } from "vitest";

vi.mock("closest-match", () => ({
  closestMatch: () => null,
}));

describe("assertKey closestMatch fallbacks", () => {
  it("handles closestMatch returning null", async () => {
    const { assertKey, InvalidKeyError } = await import("../assert-key.js");
    const target = { firstName: "A", lastName: "B" };

    try {
      assertKey(target, "firstname");
      expect.fail("Expected InvalidKeyError");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidKeyError);
      expect((error as InstanceType<typeof InvalidKeyError>).suggestions).toEqual([]);
    }
  });
});

