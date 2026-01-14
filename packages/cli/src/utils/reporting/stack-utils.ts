import path from "node:path";

interface NormalizedFrame {
  readonly text: string;
  readonly framework: boolean;
}

export function formatStackLines(
  lines: readonly string[],
  limit: number
): { lines: string[]; truncated: boolean } {
  const cwd = process.cwd();
  const max = Math.max(limit, 0);
  const normalized: NormalizedFrame[] = [];
  let count = 0;

  for (const line of lines) {
    if (max && count >= max) {
      return { lines: filterFrameworkFrames(normalized), truncated: true };
    }
    const info = normalizeStackLine(line.trimEnd(), cwd);
    normalized.push({
      text: info.text,
      framework: info.relativePath ? isFrameworkPath(info.relativePath) : false,
    });
    count += 1;
  }

  return { lines: filterFrameworkFrames(normalized), truncated: false };
}

export function partitionErrorLines(lines: readonly string[]): {
  messageLines: string[];
  stackLines: string[];
} {
  const messageLines: string[] = [];
  const stackLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (isStackLine(trimmed)) {
      stackLines.push(line);
    } else {
      messageLines.push(line);
    }
  }

  while (messageLines.length > 0) {
    const last = messageLines[messageLines.length - 1];
    if (!last || last.trim().length === 0) {
      messageLines.pop();
      continue;
    }
    break;
  }

  return { messageLines, stackLines };
}

function normalizeStackLine(
  line: string,
  cwd: string
): { text: string; relativePath?: string } {
  // eslint-disable-next-line no-useless-escape
  const stackRegex = /(.*?\()?(?<filepath>(?:[a-zA-Z]:)?[\\/][^:\)]+)(?<position>:\d+:\d+)(\))?/;
  const match = line.match(stackRegex);

  if (!match || !match.groups) {
    return { text: line };
  }

  const { filepath, position } = match.groups as { filepath: string; position: string };
  const absolute = path.normalize(filepath);
  const relative = path.relative(cwd, absolute) || absolute;

  return {
    text: line.replace(`${filepath}${position}`, `${relative}${position}`),
    relativePath: relative,
  };
}

function filterFrameworkFrames(frames: NormalizedFrame[]): string[] {
  if (frames.length === 0) {
    return [];
  }

  const filtered = frames.filter((frame, index) => index === 0 || !frame.framework);
  if (filtered.length === 0) {
    return frames.map((frame) => frame.text);
  }

  return filtered.map((frame) => frame.text);
}

function isFrameworkPath(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  return (
    normalized.includes("node_modules/") ||
    normalized.startsWith("packages/runner/") ||
    normalized.startsWith("packages/executor/")
  );
}

function isStackLine(line: string): boolean {
  if (!line) {
    return false;
  }
  if (line.startsWith("at ")) {
    return true;
  }
  return /\((?:[a-zA-Z]:)?[^():]+:\d+:\d+\)$/.test(line);
}
