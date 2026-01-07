import { CucumberRunner } from "@autometa/runner";

export interface HoistedWorld {
  readonly state: Record<string, unknown>;
}

const runner = CucumberRunner.builder().withWorld<HoistedWorld>({ state: {} });

export const stepsEnvironment = runner.steps();
export const { Given, Then, ensure } = stepsEnvironment;

Given("the hoisted steps are loaded", (world: HoistedWorld) => {
  world.state["hoisted:seen"] = true;
});

Then("the hoisted step should run", (world: HoistedWorld) => {
  ensure(world.state["hoisted:seen"]).toStrictEqual(true);
});
