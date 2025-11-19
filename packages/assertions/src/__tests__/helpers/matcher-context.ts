import type { FailureDetails, MatcherContext } from "../../core/context";

export class TestMatcherError extends Error {
  public readonly matcher: string;
  public readonly details: FailureDetails;

  constructor(matcher: string, details: FailureDetails) {
    super(details.message);
    this.matcher = matcher;
    this.details = details;
  }
}

export interface TestMatcherContext<T> extends MatcherContext<T> {
  readonly failCalls: readonly TestMatcherCall[];
}

export interface TestMatcherCall {
  readonly matcher: string;
  readonly details: FailureDetails;
}

export interface CreateMatcherContextOptions {
  readonly negated?: boolean;
  readonly label?: string;
}

export function createMatcherContext<T>(
  value: T,
  options: CreateMatcherContextOptions = {}
): TestMatcherContext<T> {
  const calls: TestMatcherCall[] = [];
  const context: MatcherContext<T> = {
    value,
    negated: options.negated ?? false,
    ...(options.label !== undefined ? { label: options.label } : {}),
    fail: (matcher, details) => {
      calls.push({ matcher, details });
      throw new TestMatcherError(matcher, details);
    },
  };

  return Object.assign(context, { failCalls: calls });
}
