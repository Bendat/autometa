import { Feature } from "@autometa/cucumber-runner";
import { Docstring } from "@autometa/cucumber-runner";
import { Given } from "@autometa/cucumber-runner";

Given("a Docstring", (docstring: Docstring) => {
  console.log(docstring);
});

Feature("./docstring.feature");
