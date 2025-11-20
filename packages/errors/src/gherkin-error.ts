import { AutomationError, type AutomationErrorOptions } from "./automation-error";

const CONTEXT_SYMBOL = Symbol.for("autometa.gherkinErrorContext");

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export interface SourceLocation {
  readonly filePath: string;
  readonly start: SourcePosition;
  readonly end?: SourcePosition;
}

export interface GherkinContextSegment {
  readonly featureName?: string;
  readonly stepKeyword?: string;
  readonly stepText?: string;
  readonly location: SourceLocation;
}

export interface CodeContextSegment {
  readonly functionName?: string;
  readonly location: SourceLocation;
}

export interface GherkinErrorContext {
  readonly gherkin?: GherkinContextSegment;
  readonly code?: CodeContextSegment;
}

export interface GherkinStepErrorOptions extends AutomationErrorOptions {
  readonly context: GherkinErrorContext;
}

function freezePosition(position: SourcePosition): SourcePosition {
  return Object.freeze({
    line: position.line,
    column: position.column,
  });
}

function freezeLocation(location: SourceLocation): SourceLocation {
  return Object.freeze({
    filePath: location.filePath,
    start: freezePosition(location.start),
    ...(location.end ? { end: freezePosition(location.end) } : {}),
  });
}

function freezeGherkinSegment(segment: GherkinContextSegment): GherkinContextSegment {
  return Object.freeze({
    location: freezeLocation(segment.location),
    ...(segment.featureName !== undefined ? { featureName: segment.featureName } : {}),
    ...(segment.stepKeyword !== undefined ? { stepKeyword: segment.stepKeyword } : {}),
    ...(segment.stepText !== undefined ? { stepText: segment.stepText } : {}),
  });
}

function freezeCodeSegment(segment: CodeContextSegment): CodeContextSegment {
  return Object.freeze({
    location: freezeLocation(segment.location),
    ...(segment.functionName !== undefined ? { functionName: segment.functionName } : {}),
  });
}

function freezeContext(context: GherkinErrorContext): GherkinErrorContext {
  return Object.freeze({
    ...(context.gherkin ? { gherkin: freezeGherkinSegment(context.gherkin) } : {}),
    ...(context.code ? { code: freezeCodeSegment(context.code) } : {}),
  });
}

function setContext(target: object, context: GherkinErrorContext): void {
  Object.defineProperty(target, CONTEXT_SYMBOL, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: freezeContext(context),
  });
}

function getContext(target: unknown): GherkinErrorContext | undefined {
  if (!target || typeof target !== "object") {
    return undefined;
  }
  return Reflect.get(target, CONTEXT_SYMBOL) as GherkinErrorContext | undefined;
}

/**
 * Error subtype used to wrap failures that occur while executing a Gherkin step.
 */
export class GherkinStepError extends AutomationError {
  constructor(message: string, options: GherkinStepErrorOptions) {
    const { context, ...rest } = options;
    super(message, rest);
    this.name = "GherkinStepError";
    setContext(this, context);
  }

  get context(): GherkinErrorContext {
    const context = getContext(this);
    if (!context) {
      throw new Error("Missing Gherkin context for error instance");
    }
    return context;
  }
}

export function isGherkinStepError(value: unknown): value is GherkinStepError {
  return value instanceof GherkinStepError;
}

interface ErrorWithCause extends Error {
  readonly cause?: unknown;
}

export function getGherkinErrorContext(value: unknown): GherkinErrorContext | undefined {
  const visited = new Set<Error>();
  let current: unknown = value;

  while (current instanceof Error && !visited.has(current)) {
    visited.add(current);
    const context = getContext(current);
    if (context) {
      return context;
    }

    if (!("cause" in current)) {
      break;
    }

    const cause = (current as ErrorWithCause).cause;
    if (!(cause instanceof Error)) {
      break;
    }
    current = cause;
  }

  return undefined;
}
