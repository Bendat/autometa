import { describe, expect, it } from "vitest";
import { FromPhrase, IFromPhrase } from "./from-phrase";
import { camel } from "./string-transformer";
@FromPhrase
class TestClass {
  myUser = "Bobby Sands";
  declare fromPhrase: IFromPhrase;
}
describe("FromPhrase", () => {
  describe("attaching fromPhrase to a class", () => {
    it("should attach fromPhrase to a class", () => {
      const test = new TestClass();
      expect(test.fromPhrase).toBeDefined();
      console.log(test.fromPhrase.toString());
      const user = test.fromPhrase("my User", camel);
      expect(user).toBe("Bobby Sands");
    });
  });
});
