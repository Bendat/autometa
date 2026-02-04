import { Given } from "../../autometa.steps";

// Intentionally uses the same step text as api/example to prove module scoping:
// it should never be visible to a feature scoped to api/example.
Given("the api example module step is visible", function () {
  throw new Error("The api/other module step should not be visible to api/example features.");
});

