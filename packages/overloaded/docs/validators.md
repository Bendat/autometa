```markdown
<!-- cspell:disable -->

# Validator Architecture

## Objectives
- Provide a consistent runtime contract for all validators consumed by the overload matcher.
- Encode validator strictness so scoring can favour the most specific signature.
- Emit rich diagnostics that pinpoint where and why validation failed.
- Support optional arguments and value transforms without compromising type safety.

## Core Interfaces
```ts
export interface ValidationIssue {
  readonly path: Array<string | number>;
  readonly message: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: ValidationIssue[];
}

export interface ValidatorInstance<T = unknown, TOut = T> {
  readonly optional: boolean;
  readonly specificity: number;
  readonly summary: string;
  validate(value: unknown, path: ValidationPath): ValidationResult & { value?: TOut };
}
```
- `optional`: when true, the matcher treats `undefined`/missing arguments as valid and skips validation.
- `specificity`: numeric weight used by the matcher scoring algorithm (greater value = stricter).
- `summary`: short human-readable description surfaced in diagnostics (e.g., `"string"`, `"tuple<[number]>"`).
- `validate`: returns success/failure plus an optional transformed value. Transforms remain internal until we decide how to pass them to handlers (see **Transforms** below).

## Base Factory Helper
Create a `createValidator` utility responsible for:
- Normalising options (`optional`, custom messages, transforms).
- Providing ergonomics for composing diagnostics with contextual labels (`Arg[index]`, `Element[index]`).
- Enforcing that validators push issues instead of throwing.

```ts
interface ValidatorOptions {
  readonly optional?: boolean;
  readonly message?: string | ((ctx: MessageContext) => string);
  readonly specificity?: number;
}

function createValidator(config: {
  summary: string;
  specificity: number;
  options?: ValidatorOptions;
  validate(value: unknown, ctx: ValidationContext): boolean;
}): ValidatorInstance {
  // ...
}
```

`ValidationContext` carries the argument path and a mutable `issues` array (owned by the matcher) so validators can append structured diagnostics without allocations.

## Specificity Guidelines
- Literal / enum: `5`
- Tuple / shape / structured objects: `4`
- Instance with shape, function with constraints: `3`
- Primitive with constraints or typed arrays: `3`
- Plain string/number/boolean/date: `2`
- Unknown / passthrough: `0`

Validators may override defaults through options when composing richer semantics (e.g., tuple of literals should reach `5`).

## Optional Handling
- Optional validators still report their `specificity` so signatures including optional parameters can compete fairly.
- When an argument is omitted (`index >= args.length`) or explicitly `undefined`, the matcher marks it valid if `optional === true`.
- Validators should avoid treating `undefined` as a valid value unless `optional` is set; this keeps diagnostics consistent.

## Diagnostics Strategy
- Every failure must push a `ValidationIssue` describing the problem. Prefer actionable messages (`"expected integer >= 0"` over `"invalid"`).
- Nested validators (`tuple`, `array`, `shape`) should extend the path before delegating to children, e.g. `ctx.child(index)` returns a new context for recursion while sharing the issue buffer.
- Composition helpers (`oneOf`, unions) aggregate issues from each branch, prefixing branch labels to keep messages clear.

## Transforms (Future Hook)
- Some validators may parse or coerce values (e.g., string to number). The current plan records the transformed value on the `ValidationResult` but the matcher ignores it for now.
- A later iteration can thread transformed values into handler invocation if we decide to support runtime casting.

## Next Steps
1. Implement `createValidator` and shared context helpers in `src/validators/base.ts`.
2. Rebuild primitive validators (`string`, `number`, `boolean`, `unknown`, `literal`).
3. Add composition utilities (`optional`, `oneOf`) and collection shapes (`array`, `tuple`).
4. Integrate validators with signature normalisation so `specificity` sums correctly.

<!-- cspell:enable -->
```
