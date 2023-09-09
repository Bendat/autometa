import { Given, Teardown } from "@autometa/runner";

Given("my rule setup step", () => {
  expect(true).toBe(true);
});

Teardown(
  "my rule teardown step",
  () => {
    expect.assertions(1);
    console.log('success')
  },
);
