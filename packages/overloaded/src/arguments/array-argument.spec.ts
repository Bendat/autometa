import { describe } from "vitest";
import { array } from "./array-argument";
import { string } from "./string-argument";

describe("Array Argument", () => {
  describe("validators", () => {
    describe("assertIsArray", () => {
      it("should validate that a value is an array", () => {
        const sut = array([string()]);
        
      });
    });
  });
});
