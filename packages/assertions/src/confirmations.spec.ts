import { describe, expect, it } from "vitest";
import { camel } from "@autometa/phrases";
import { FromLiteral, FromPhrase } from "./confirmations";
describe("retrievals", () => {
  describe("fromKey", () => {
    it("should return a property value if it can be matched by a phrase", () => {
      const obj = { liquorStore: "Robbies Bobbies" };
      const name = FromPhrase(obj, "liquor Store", camel);
      expect(name).toEqual("Robbies Bobbies");
    });
  });
  describe("fromPhrase", () => {
    it("should return a property value if it can be matched by a phrase", () => {
      const obj = { liquorStore: "Robbies Bobbies" };
      const name = FromPhrase(obj, "liquor Store", camel);
      expect(name).toEqual("Robbies Bobbies");
    });
  });
  describe("fromLiteral", () => {
    it("should return a property value if it can be matched by a phrase", () => {
      const obj = { liquorStore: "Robbies Bobbies" } as const;
      const name = FromLiteral(obj, "liquorStore");
      expect(name).toEqual("Robbies Bobbies");
    });
  });
  describe("assertions", () => {
    describe("isKey", () => {
      it("should throw an error if the key does not exist", () => {
        const obj = { liquorStore: "Robbies Bobbies" } as const;
        expect(() => FromLiteral(obj, "liquorStore")).not.toThrow();
        expect(() => FromLiteral(obj, "liquorStore2")).toThrow();
      });
    });
    describe("isPhrase", () => {
      it("should throw an error if the key does not exist", () => {
        const obj = { liquorStore: "Robbies Bobbies" } as const;
        expect(() => FromPhrase(obj, "liquor Store", camel)).not.toThrow();
        expect(() => FromPhrase(obj, "liquor Store2", camel)).toThrow();
      });
    });
  });
});
