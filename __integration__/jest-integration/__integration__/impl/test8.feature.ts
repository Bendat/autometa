import { Before, Feature, Given, Setup } from "@autometa/runner";
Setup("pre suite hook", ({ world, singleton }) => {
  singleton.value = 1;
  world.foo = 1;
  console.log("setup");
});

Before(
  "before hook",
  ({ world }) => {
    world.bar = 2;
    console.log("before");
  },
  "@foo"
);

Given("a setup hook was run", ({ world, singleton }) => {
  world.foo = 1;
  expect(singleton.value).toBe(1);
  expect(world.bar).toBe(2);
});

Given("a before hook was run", ({ world }) => {
  expect(world.foo).toBe(1);
});

Feature("../features/test8.feature");
