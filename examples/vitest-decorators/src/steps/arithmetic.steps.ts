import "reflect-metadata";
import { Binding, Given, When, Then, And, getBindingSteps } from "../decorators";
import type { ArithmeticWorld } from "../world";

/**
 * Arithmetic step definitions using class-based decorator pattern.
 * 
 * The world is passed to step handlers through the runner's functional API,
 * but we use a factory pattern to create step handlers that work with the class instance.
 */
@Binding()
export class ArithmeticSteps {
  /**
   * Sets the initial number in the world
   */
  @Given("I have the number {int}")
  setNumber(value: number, world: ArithmeticWorld): void {
    world.result = value;
  }

  /**
   * Adds a value to the current result
   */
  @When("I add {int}")
  addNumber(value: number, world: ArithmeticWorld): void {
    world.result = (world.result ?? 0) + value;
  }

  /**
   * Multiplies the current result by a value
   */
  @When("I multiply by {int}")
  @And("I multiply by {int}")
  multiplyNumber(value: number, world: ArithmeticWorld): void {
    world.result = (world.result ?? 0) * value;
  }

  /**
   * Asserts the result equals the expected value
   */
  @Then("the result should be {int}")
  assertResult(expected: number, world: ArithmeticWorld): void {
    if (world.result !== expected) {
      throw new Error(`Expected ${expected} but got ${world.result}`);
    }
  }
}

// Export metadata helper for the runner to use
export { getBindingSteps };
