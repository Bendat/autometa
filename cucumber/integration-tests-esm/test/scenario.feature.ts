import { Feature, Given, Pass, Then, When } from "@autometa/cucumber-runner";
import { AllureStep } from "allure-js-commons";
import { App } from "../src/app";
Feature(() => {
  Given("a setup step", async (app: App) => {
    console.log(JSON.stringify(app.stepper));
    await app.stepper.step("my hopeful step", async (step: AllureStep) =>
      step.addParameter("howsit", "3")
    );
  });
  Given("another setup step", Pass);
  Given("a third setup step", Pass);
  Given("a conjunction", Pass);
  When("an action step", Pass);
  Then("a validation step", Pass);
}, "./scenario.feature");
