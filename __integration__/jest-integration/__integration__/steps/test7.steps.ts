import { Given, Teardown } from "autometa-runner";

Given("a rule background step", () => {
  expect(true).toBe(true);
});

Given("a rule scenario step", () => {
  expect(true).toBe(true);
});

Teardown("my rule teardown step", () => {
  expect.assertions(2);
  console.log("success");
});
