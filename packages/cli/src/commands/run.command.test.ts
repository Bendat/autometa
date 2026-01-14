import { describe, it, expect } from "vitest";

import { splitPatternsAndRunnerArgs } from "../utils/handover";

describe("splitPatternsAndRunnerArgs", () => {
  it("splits args after '--' when handover is enabled", () => {
    const result = splitPatternsAndRunnerArgs({
      patterns: ["src/features/example.feature", "-t", "my test"],
      rawArgv: [
        "node",
        "autometa",
        "run",
        "src/features/example.feature",
        "--handover",
        "--",
        "-t",
        "my test",
      ],
      handover: true,
    });

    expect(result).toEqual({
      patterns: ["src/features/example.feature"],
      runnerArgs: ["-t", "my test"],
    });
  });

  it("does not split args when handover is disabled", () => {
    const result = splitPatternsAndRunnerArgs({
      patterns: ["src/features/example.feature", "-t", "my test"],
      rawArgv: [
        "node",
        "autometa",
        "run",
        "src/features/example.feature",
        "--",
        "-t",
        "my test",
      ],
      handover: false,
    });

    expect(result).toEqual({
      patterns: ["src/features/example.feature", "-t", "my test"],
      runnerArgs: [],
    });
  });
});
