import {
  Feature,
  Given,
  Pass,
  Then,
  When,
  Pending,
} from "@autometa/cucumber-runner";

Feature(() => {
  Given("a setup step", Pass);
  Given("another setup step", Pass);
  Given("a third setup step", Pass);
  Given("a conjunction", Pass);
  When("an action step", Pass);
  Then("a validation step", Pass);
}, "./scenario.feature");
