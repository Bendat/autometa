export type ValidationPath = Array<string | number>;

export interface ValidationIssue {
  readonly path: ValidationPath;
  readonly message: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
}

export interface ValidationResult<T = unknown> {
  readonly ok: boolean;
  readonly issues: ValidationIssue[];
  readonly value?: T;
}

export interface ValidatorInstance<T = unknown> {
  readonly optional: boolean;
  readonly specificity: number;
  readonly summary: string;
  validate(value: unknown, path: ValidationPath): ValidationResult<T>;
}

export type OverloadHandler = (...args: unknown[]) => unknown;

export interface ThrowsSpec {
  readonly error: new (message?: string) => Error;
  readonly message?: string;
}

export interface NormalizedSignature {
  readonly id: number;
  readonly name?: string;
  readonly description?: string;
  readonly validators: ReadonlyArray<ValidatorInstance>;
  readonly minArity: number;
  readonly requiredArity: number;
  readonly maxArity: number;
  readonly specificity: number;
  readonly fallback: boolean;
  readonly handler?: OverloadHandler;
  readonly throws?: ThrowsSpec;
}

export type MatchScore = readonly [
  specificity: number,
  requiredArity: number,
  exactArity: number,
  order: number
];

export interface SignatureFailureReport {
  readonly signature: NormalizedSignature;
  readonly issues: ValidationIssue[];
  readonly expected: string[];
}
