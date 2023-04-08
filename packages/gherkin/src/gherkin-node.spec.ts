import { Builder } from "@autometa/dto-builder";
import { GherkinNode } from "./gherkin-node";
import { it, expect, describe } from "@jest/globals";
class FakeNode extends GherkinNode {}
const FakeNodeBuilder = Builder(FakeNode);

describe("Gherkin Node", () => {
  describe("Tag Expressions", () => {
    it("should return true for an empty tags list and expression", () => {
      const node = new FakeNodeBuilder().tags(new Set()).build();
      const result = node.canExecute();
      expect(result).toBe(true);
    });
    it("should should return true for a tags list and empty expression", () => {
      const node = new FakeNodeBuilder().tags(new Set(["@a", "@b"])).build();
      const result = node.canExecute();
      expect(result).toBe(true);
    });
    it("should should return true for a tags list and a matching expression", () => {
      const node = new FakeNodeBuilder().tags(new Set(["@a", "@b"])).build();
      const result = node.canExecute("@a and @b");
      expect(result).toBe(true);
    });
    it("should should return true for a tags list and a partial matching expression", () => {
      const node = new FakeNodeBuilder().tags(new Set(["@a", "@b"])).build();
      const result = node.canExecute("@a");
      expect(result).toBe(true);
    });

    it("should should return false for a tags list and a non matching expression", () => {
      const node = new FakeNodeBuilder().tags(new Set(["@a", "@b"])).build();
      const result = node.canExecute("not @a");
      expect(result).toBe(false);
    });
  });
});