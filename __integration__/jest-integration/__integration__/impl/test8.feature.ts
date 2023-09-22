import { Before, Feature, Given, Setup } from "@autometa/runner";
import { Pass } from "@autometa/scopes";

Setup("pre suite hook", () => {
  console.log("setup");
});

Before("before hook", () => {
  console.log("before");
});

Given("a setup hook was run", Pass);

Given("a before hook was run", Pass);

Feature("../features/test8.feature");
