import fg from "fast-glob";
import { isAbsolute, resolve } from "node:path";

export async function expandFilePatterns(
  patterns: readonly string[] | undefined,
  cwd: string
): Promise<string[]> {
  if (!patterns || patterns.length === 0) {
    return [];
  }

  const normalized: string[] = patterns.map((pattern) =>
    isAbsolute(pattern) ? pattern : resolve(cwd, pattern)
  );

  const entries = (await fg(normalized, {
    cwd,
    absolute: true,
    onlyFiles: true,
    unique: true,
    followSymbolicLinks: true,
  })) as string[];

  return entries.sort((a, b) => a.localeCompare(b));
}
