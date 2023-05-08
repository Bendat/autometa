export class Accumulator<T> extends Array<T | Accumulator<T>> {
  asString(depth = 0) {
    let str = "";
    for (const value of this) {
      if (typeof value === "string") {
        str += "   ".repeat(depth) + value + "\n";
      }
      if (value instanceof Accumulator) {
        str += value.asString(depth + 1) + "\n";
      }
    }
    return str;
  }
}
