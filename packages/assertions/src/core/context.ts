export interface FailureDetails {
  readonly message: string;
  readonly actual?: unknown;
  readonly expected?: unknown;
}

export interface MatcherState<T> {
  readonly value: T;
  readonly label?: string;
  readonly negated: boolean;
}

export interface MatcherContext<T> extends MatcherState<T> {
  fail(matcher: string, details: FailureDetails): never;
}

export function shouldFail(pass: boolean, negated: boolean): boolean {
  return negated ? pass : !pass;
}
