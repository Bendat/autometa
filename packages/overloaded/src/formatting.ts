import chalk from "chalk";

export function colorCompareArgStrings(expected: string[], actual: string[]) {
  const maxLength = Math.max(expected.length, actual.length);
  const firstAccumulator: string[] = [];
  const secondAccumulator: string[] = [];
  for (let i = 0; i < maxLength; i++) {
    const firstArg = expected[i];
    const secondArg = actual[i];
    if (firstArg !== secondArg) {
      firstAccumulator.push(chalk.yellow(firstArg));
      secondAccumulator.push(chalk.red(secondArg));
    } else {
      firstAccumulator.push(chalk.green(firstArg));
      secondAccumulator.push(chalk.green(secondArg));
    }
  }
  return [firstAccumulator, secondAccumulator];
}

export function argStringArray(args: unknown[]) {
  return args.map((arg) => {
    const type = typeof arg;
    const asRecord = arg as Record<string, unknown>;
    if (typeof asRecord === "object" && "constructor" in asRecord) {
      return asRecord.constructor.name;
    }
    return type;
  });
}
