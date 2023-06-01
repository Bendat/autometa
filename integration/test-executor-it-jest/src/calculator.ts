export class Calculator {
  accumulator: number[] = [];
  push(a: number) {
    this.accumulator.push(a);
  }
  add() {
    const result = this.accumulator.reduce((a, b) => a + b, 0);
    this.accumulator = [];
    return result;
  }
}
