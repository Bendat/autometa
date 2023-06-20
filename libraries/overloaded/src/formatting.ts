import cli from "colors-cli";

export function colorCompareArgStrings(expected: string[], actual: string[]) {
  const maxLength = Math.max(expected.length, actual.length);
  const firstAccumulator: string[] = [];
  const secondAccumulator: string[] = [];
  for (let i = 0; i < maxLength; i++) {
    const firstArg = expected[i];
    const secondArg = actual[i];
    if (firstArg !== secondArg) {
      firstAccumulator.push(cli.yellow(firstArg));
      secondAccumulator.push(cli.red(secondArg));
    } else {
      firstAccumulator.push(cli.green(firstArg));
      secondAccumulator.push(cli.green(secondArg));
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
