import "reflect-metadata";
import { Binding, Given, When, Then, And, getBindingSteps } from "../decorators";
import type { ArithmeticWorld } from "../world";
import { CalculatorService } from "../services";

/**
 * Arithmetic step definitions using class-based decorator pattern with DI.
 * 
 * The world and services are injected via constructor.
 * This enables a cleaner API where steps only receive their Cucumber parameters.
 */
@Binding()
export class ArithmeticSteps {
  /**
   * Constructor injection - world and services are provided by the DI container
   */
  constructor(
    private readonly world: ArithmeticWorld,
    private readonly calculator: CalculatorService = new CalculatorService()
  ) {}

  /**
   * Sets the initial number in the world
   */
  @Given("I have the number {int}")
  setNumber(value: number): void {
    this.world.result = value;
  }

  /**
   * Adds a value to the current result using the calculator service
   */
  @When("I add {int}")
  addNumber(value: number): void {
    this.world.result = this.calculator.add(this.world.result ?? 0, value);
  }

  /**
   * Multiplies the current result by a value using the calculator service
   */
  @When("I multiply by {int}")
  @And("I multiply by {int}")
  multiplyNumber(value: number): void {
    this.world.result = this.calculator.multiply(this.world.result ?? 0, value);
  }

  /**
   * Asserts the result equals the expected value
   */
  @Then("the result should be {int}")
  assertResult(expected: number): void {
    if (this.world.result !== expected) {
      throw new Error(`Expected ${expected} but got ${this.world.result}`);
    }
  }
}

// Export metadata helper for the runner to use
export { getBindingSteps };
