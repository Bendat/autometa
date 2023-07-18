import { describe, expect, it } from "vitest";
import { AssertKey, ConfirmKey, FromKey, InvalidKeyError } from ".";
describe("confirmations", () => {
  describe("AssertKey", () => {
    it("should throw an error if the key is not in the object", () => {
      expect(() => AssertKey({}, "foo")).to.throw();
    });
    it("should not throw an error if the key is in the object", () => {
      expect(() => AssertKey({ foo: "bar" }, "foo")).to.not.throw();
    });
    it("should throw an error if the key is not a string", () => {
      expect(() =>
        AssertKey({ foo: "bar" }, 1 as unknown as string)
      ).to.throw();
    });
    it("should contain a closest match", () => {
      try {
        AssertKey({ foo: "bar" }, "fo");
        expect.fail();
      } catch (e) {
        const err = e as InvalidKeyError<{ foo: "bar" }>;
        expect(err.bestMatches).to.contain("foo");
      }
    });
  });
  describe("ConfirmKey", () => {
    it("should return false if the key is not in the object", () => {
      expect(ConfirmKey({}, "foo")).to.be.false;
    });
    it("should return true if the key is in the object", () => {
      expect(ConfirmKey({ foo: "bar" }, "foo")).to.be.true;
    });
  });
  describe("FromKey", () => {
    it("should return the value of the key", () => {
      expect(FromKey({ foo: "bar" }, "foo")).to.equal("bar");
    });
  });
});
