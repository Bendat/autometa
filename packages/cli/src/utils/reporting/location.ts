import path from "node:path";

import type { SourceLocation } from "@autometa/errors";

export function formatSourceLocation(location: SourceLocation): string {
  return `${relativePath(location.filePath)}:${location.start.line}:${location.start.column}`;
}

export function relativePath(filePath: string): string {
  const cwd = process.cwd();
  const relative = path.relative(cwd, filePath);
  return relative || filePath;
}
