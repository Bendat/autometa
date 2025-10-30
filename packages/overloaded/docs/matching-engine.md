<!-- cspell:disable -->

# Matching Engine Design

## Goals
- Select the most specific overload based on validator metadata and runtime arguments.
- Produce deterministic results; ambiguity must be surfaced, not hidden.
- Keep evaluation efficient even when dozens of overloads are declared.
- Preserve compatibility with fallback entries and `throws` expectations.

## Terminology
- **Signature**: normalized representation of a `def` entry (arity, validators, metadata, handler type).
- **Actual call**: the array of values passed to `.use(args)`.
- **Score**: numeric tuple used to rank candidate signatures.

## Matching Pipeline
1. **Normalize** overload definitions when `overloads(...)` is constructed.
   - Derive `minArity`, `maxArity` (based on optional validators).
   - Precompute `validatorFingerprint` for quick coarse comparisons.
   - Cache `specificityWeight` per validator (see below).
2. **Evaluate call** at runtime.
   - Filter signatures whose arity range cannot satisfy the argument count.
   - Run validators sequentially, collecting diagnostics in a shared context.
   - If any validator fails, capture diagnostic bundle for later reporting.
3. **Score successful matches**.
   - `matchScore = [specificitySum, exactArity, declarationIndex]` where higher is better.
   - `specificitySum`: sum of validator weights (e.g., literal > enum > primitive > unknown).
   - `exactArity`: boolean converted to `1` (exact) or `0` (optional/truncated) to prefer full matches.
   - `declarationIndex`: monotonically increasing id; higher wins to make later definitions override earlier ones when otherwise equivalent.
4. **Resolve result**.
   - If no matches, use fallback if present; otherwise throw aggregated mismatch error.
   - If exactly one match, invoke handler or error type (for `throws`).
   - If multiple matches share identical scores, throw `AmbiguousOverloadError` with involved signatures listed.

## Validator Specificity Weights (initial pass)
| Validator Type                      | Weight |
| ----------------------------------- | ------ |
| Literal / Enum (exact value)        | 5      |
| Tuple / Shape with nested checks    | 4      |
| Instance with shape                 | 4      |
| Function with arity/name constraints| 3      |
| Primitive with constraints (min/max)| 3      |
| Array with typed elements           | 3      |
| Primitive (string/number/boolean)   | 2      |
| Unknown / Any                       | 0      |

Weights may be refined once validators are refactored; provide hooks for validators to declare their own specificity contribution.

## Data Structures
```ts
interface NormalizedSignature {
  id: number; // declaration order
  name?: string;
  description?: string;
  validators: ValidatorInstance[];
  handler: OverloadHandler;
  minArity: number;
  maxArity: number; // inclusive
  specificitySum: number;
  fallback: boolean;
  throws?: ErrorConstructor;
}

interface MatchContext {
  args: unknown[];
  diagnostics: DiagnosticBundle[];
}
```

- `ValidatorInstance` exposes `validate(value, ctx)`, `isOptional`, `specificityWeight`.
- Diagnostics include structured paths: `path: ["arg", index, ...nested]`, `message`, optional `expected`, `actual` values.

## Diagnostics Aggregation
- Each non-matching signature appends a `SignatureFailureReport` containing its index, expected type list, and collected validator failures.
- Final error format:
  ```text
  No overload matched for (number, string, boolean)
  • Overload[foo(a: number)]
    - Arg[1] expected string but received boolean true
  • Overload[foo(a: number, b: string)]
    - Arg[2] missing but required
  ```
- Provide structured payload for programmatic consumers alongside human-readable message.

## Performance Considerations
- Short-circuit validation as soon as a validator fails; no need to evaluate remaining validators for that signature.
- Optionally pre-group signatures by arity to reduce candidate set.
- Consider caching successful signature id per argument length for repeated calls (LRU by arity) as an optimisation.

## Open Questions
- Should validators be able to “narrow” values (e.g., return parsed struct)? If yes, need a pipeline to pass transformed values to handlers.
- How to expose debugging hooks (e.g., run in verbose mode to print scoring decisions)?
- Do we need async validation support now or can we defer to a future release?

```text
Next Step → Implement a prototype `Matcher` module encapsulating the above pipeline and draft unit tests for scoring behaviour.
```

<!-- cspell:enable -->
