import { Builder } from "@autometa/dto-builder";
import { GherkinNode } from "./gherkin-node";
import { test, expect } from "vitest";
class FakeNode extends GherkinNode {}
const FakeNodeBuilder = Builder(FakeNode);
test("Empty tags always pass", () => {
  const node = new FakeNodeBuilder().tags([]).build();
  const result = node.canExecute();
  expect(result).toBe(true);
});
