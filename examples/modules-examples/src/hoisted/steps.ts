import { CucumberRunner } from "@autometa/runner";

export interface HoistedWorld {
  readonly state: Record<string, unknown>;
}

const runner = CucumberRunner.builder().withWorld<HoistedWorld>({ state: {} });

export const stepsEnvironment = runner.steps();
export const { Given, Then, ensure } = stepsEnvironment;

Given("the hoisted steps are loaded", function (this: HoistedWorld) {
  this.state["hoisted:seen"] = true;
});

Then("the hoisted step should run", function (this: HoistedWorld) {
  ensure(this.state["hoisted:seen"]).toStrictEqual(true);
});
