import { Given, Then, When } from "@autometa/runner";

Given("a step with the number {number}", (a) => {
  expect(a).toBe(4);
});

When("a step with the string {string}", (a) => {
  expect(a).toBe("foo");
});

Then("a step with the boolean {primitive}", (a) => {
  expect(a).toBe(true);
});
