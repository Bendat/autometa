import fs from "node:fs";

import { codeFrameColumns } from "@babel/code-frame";
import pc from "picocolors";

import type {
  GherkinContextPathSegment,
  GherkinErrorContext,
  SourceLocation,
} from "@autometa/errors";

import { formatSourceLocation } from "./location";
import {
  ImmediateHierarchicalLog,
  type HierarchicalLog,
} from "../logging/hierarchical-log";

export interface GherkinContextPrinterOptions {
  readonly includePath?: boolean;
  readonly includeCodeFrame?: boolean;
}

export class GherkinContextPrinter {
  constructor(
    private readonly log: HierarchicalLog = new ImmediateHierarchicalLog(),
    private readonly options: GherkinContextPrinterOptions = {}
  ) {}

  printContext(context: GherkinErrorContext, depth: number): void {
    if (this.options.includeCodeFrame && context.gherkin) {
      const details = this.describeGherkinSegment(context.gherkin);
      const pathSegments = context.path;
      this.printCodeFrameSection(
        "Gherkin",
        context.gherkin.location,
        details,
        depth,
        {
          includeLocation: !pathSegments || pathSegments.length === 0,
        }
      );
    }

    if (this.options.includePath && context.path && context.path.length > 0) {
      this.printGherkinPath(context.path, depth);
    }

    if (context.code) {
      const details = this.describeCodeSegment(context.code);
      this.printCodeFrameSection("Step implementation", context.code.location, details, depth);
    }
  }

  private printCodeFrameSection(
    title: string,
    location: SourceLocation,
    details: string | undefined,
    depth: number,
    options: { includeLocation?: boolean } = {}
  ): void {
    const headerParts = [title];
    if (details) {
      headerParts.push(details);
    }
    if (options.includeLocation !== false) {
      headerParts.push(pc.dim(formatSourceLocation(location)));
    }
    const scope = this.log.scoped(depth);
    scope.write(pc.cyan(headerParts.join(" - ")));

    const frame = this.buildCodeFrame(location);
    if (!frame) {
      scope.scoped(1).write(pc.dim("Unable to read source snippet"));
      return;
    }

    for (const line of frame) {
      scope.scoped(1).write(line);
    }
  }

  private buildCodeFrame(location: SourceLocation): readonly string[] | undefined {
    try {
      const contents = fs.readFileSync(location.filePath, "utf8");
      const frame = codeFrameColumns(
        contents,
        {
          start: location.start,
          ...(location.end ? { end: location.end } : {}),
        },
        {
          linesAbove: 2,
          linesBelow: 2,
          highlightCode: true,
        }
      );
      return frame.split("\n");
    } catch {
      return undefined;
    }
  }

  private printGherkinPath(
    pathSegments: readonly GherkinContextPathSegment[],
    depth: number
  ): void {
    if (pathSegments.length === 0) {
      return;
    }

    let scope = this.log.scoped(depth);
    let previousKey: string | undefined;

    for (const segment of pathSegments) {
      const segmentKey = this.describePathKey(segment);
      if (segmentKey === previousKey) {
        continue;
      }
      previousKey = segmentKey;
      scope.write(pc.dim(`at ${this.describePathLabel(segment)}`));
      scope = scope.scoped(1);
    }
  }

  private describeGherkinSegment(
    segment: GherkinErrorContext["gherkin"]
  ): string | undefined {
    if (!segment) {
      return undefined;
    }
    const keyword = segment.stepKeyword?.trim();
    const text = segment.stepText?.trim();
    const parts = [keyword, text].filter((value): value is string => Boolean(value && value.length));
    if (parts.length) {
      return parts.join(" ");
    }
    if (segment.featureName) {
      return `Feature: ${segment.featureName}`;
    }
    return undefined;
  }

  private describeCodeSegment(segment: GherkinErrorContext["code"]): string | undefined {
    if (!segment) {
      return undefined;
    }
    return segment.functionName ?? undefined;
  }

  private describePathKey(segment: GherkinContextPathSegment): string {
    return `${segment.role}|${segment.name ?? ""}|${segment.text ?? ""}|${segment.index ?? ""}`;
  }

  private describePathLabel(segment: GherkinContextPathSegment): string {
    const location = formatSourceLocation(segment.location);
    switch (segment.role) {
      case "feature": {
        const name = segment.name?.trim();
        return name ? `Feature: ${name} (${location})` : `Feature (${location})`;
      }
      case "rule": {
        const name = segment.name?.trim();
        return name ? `Rule: ${name} (${location})` : `Rule (${location})`;
      }
      case "outline": {
        const name = segment.name?.trim();
        return name ? `Scenario Outline: ${name} (${location})` : `Scenario Outline (${location})`;
      }
      case "scenario": {
        const name = segment.name?.trim();
        return name ? `Scenario: ${name} (${location})` : `Scenario (${location})`;
      }
      case "example": {
        const label =
          segment.name?.trim() ??
          (segment.index !== undefined ? `Example #${segment.index + 1}` : undefined);
        return label ? `${label} (${location})` : `Example (${location})`;
      }
      case "step": {
        const keyword = segment.keyword?.trim();
        const text = segment.text?.trim();
        const labelParts = [keyword, text].filter((value): value is string => Boolean(value && value.length));
        const label = labelParts.length ? labelParts.join(" ") : "Step";
        return `Step: ${label} (${location})`;
      }
      default:
        return `${segment.role} (${location})`;
    }
  }
}
