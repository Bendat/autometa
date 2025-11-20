export interface HierarchicalLog {
  write(line: string, depth?: number): void;
  flush(): void;
  scoped(offset: number): HierarchicalLog;
}

export interface HierarchicalLogOptions {
  readonly indent?: string;
}

interface LogEntry {
  readonly depth: number;
  readonly line: string;
}

const DEFAULT_INDENT = "  ";

export class BufferedHierarchicalLog implements HierarchicalLog {
  private readonly indent: string;
  private readonly entries: LogEntry[] = [];

  constructor(
    private readonly sink: (line: string) => void = console.log,
    options: HierarchicalLogOptions = {}
  ) {
    this.indent = options.indent ?? DEFAULT_INDENT;
  }

  write(line: string, depth = 0): void {
    const normalizedDepth = depth >= 0 ? depth : 0;
    this.entries.push({ line, depth: normalizedDepth });
  }

  flush(): void {
    if (this.entries.length === 0) {
      return;
    }
    for (const entry of this.entries) {
      if (entry.line.length === 0) {
        this.sink("");
        continue;
      }
      const indent = this.indent.repeat(entry.depth);
      this.sink(`${indent}${entry.line}`);
    }
    this.entries.length = 0;
  }

  scoped(offset: number): HierarchicalLog {
    const base = offset >= 0 ? offset : 0;
    return new BufferedScopedHierarchicalLog(this, base);
  }
}

class BufferedScopedHierarchicalLog implements HierarchicalLog {
  constructor(
    private readonly root: BufferedHierarchicalLog,
    private readonly base: number
  ) {}

  write(line: string, depth = 0): void {
    const normalizedDepth = depth >= 0 ? depth : 0;
    this.root.write(line, this.base + normalizedDepth);
  }

  flush(): void {
    this.root.flush();
  }

  scoped(offset: number): HierarchicalLog {
    const nextBase = this.base + (offset >= 0 ? offset : 0);
    return new BufferedScopedHierarchicalLog(this.root, nextBase);
  }
}

export class ImmediateHierarchicalLog implements HierarchicalLog {
  private readonly indent: string;

  constructor(
    private readonly sink: (line: string) => void = console.log,
    options: HierarchicalLogOptions = {}
  ) {
    this.indent = options.indent ?? DEFAULT_INDENT;
  }

  write(line: string, depth = 0): void {
    const normalizedDepth = depth >= 0 ? depth : 0;
    if (line.length === 0) {
      this.sink("");
      return;
    }
    const indent = this.indent.repeat(normalizedDepth);
    this.sink(`${indent}${line}`);
  }

  flush(): void {
    // immediate logger does not buffer
  }

  scoped(offset: number): HierarchicalLog {
    const base = offset >= 0 ? offset : 0;
    return new ImmediateScopedHierarchicalLog(this, base);
  }
}

class ImmediateScopedHierarchicalLog implements HierarchicalLog {
  constructor(
    private readonly root: ImmediateHierarchicalLog,
    private readonly base: number
  ) {}

  write(line: string, depth = 0): void {
    const normalizedDepth = depth >= 0 ? depth : 0;
    this.root.write(line, this.base + normalizedDepth);
  }

  flush(): void {
    this.root.flush();
  }

  scoped(offset: number): HierarchicalLog {
    const nextBase = this.base + (offset >= 0 ? offset : 0);
    return new ImmediateScopedHierarchicalLog(this.root, nextBase);
  }
}
