import { Given } from "autometa-runner";

Given("a very simple step", () => {
  console.log("success");
});

Given("a very {string} simple step ", (a, b) => {
  console.log("success", a, b);
});
