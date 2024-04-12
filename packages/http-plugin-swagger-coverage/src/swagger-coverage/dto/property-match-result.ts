export interface PropertyMatchResult {
  readonly expected: Set<string>;
  readonly present: Set<string>;
  readonly missing: Set<string>;
  readonly unknown: Set<string>;
  readonly total: number;
}
