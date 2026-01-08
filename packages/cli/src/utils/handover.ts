export interface SplitHandoverResult {
  readonly patterns: readonly string[];
  readonly runnerArgs: readonly string[];
}

export function extractArgsAfterDoubleDash(rawArgv: readonly string[]): readonly string[] {
  const idx = rawArgv.indexOf("--");
  if (idx < 0) {
    return [];
  }
  return rawArgv.slice(idx + 1);
}

export function stripTrailingArgs(
  all: readonly string[],
  suffix: readonly string[]
): readonly string[] {
  if (suffix.length === 0) {
    return [...all];
  }
  if (suffix.length > all.length) {
    return [...all];
  }

  const start = all.length - suffix.length;
  for (let i = 0; i < suffix.length; i += 1) {
    if (all[start + i] !== suffix[i]) {
      return [...all];
    }
  }

  return all.slice(0, start);
}

export function splitPatternsAndRunnerArgs(options: {
  readonly patterns: readonly string[];
  readonly rawArgv: readonly string[];
  readonly handover?: boolean;
}): SplitHandoverResult {
  const runnerArgs = options.handover ? extractArgsAfterDoubleDash(options.rawArgv) : [];
  const patterns = runnerArgs.length > 0
    ? stripTrailingArgs(options.patterns, runnerArgs)
    : [...options.patterns];

  return { patterns, runnerArgs };
}
