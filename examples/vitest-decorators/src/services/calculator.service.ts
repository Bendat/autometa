/**
 * A simple calculator service that can be injected into step classes.
 * Demonstrates how services can be used with DI in step definitions.
 */
export class CalculatorService {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error("Cannot divide by zero");
    }
    return a / b;
  }

  /**
   * Perform a sequence of operations
   */
  calculate(initial: number, operations: Array<{ op: "add" | "subtract" | "multiply" | "divide"; value: number }>): number {
    let result = initial;
    for (const { op, value } of operations) {
      switch (op) {
        case "add":
          result = this.add(result, value);
          break;
        case "subtract":
          result = this.subtract(result, value);
          break;
        case "multiply":
          result = this.multiply(result, value);
          break;
        case "divide":
          result = this.divide(result, value);
          break;
      }
    }
    return result;
  }
}
