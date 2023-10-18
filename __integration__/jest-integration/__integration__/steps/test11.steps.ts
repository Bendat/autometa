import { Given } from "@autometa/runner";
import { Foo } from "../../src";

Given("a foo {class:foo}", (instance) => {
  expect(instance).toBeInstanceOf(Foo);
  expect(instance.name).toBe("Foo Bar");
});
