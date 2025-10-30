# Overloaded v1.0 Requirements

## 1. Overload Resolution Rules
- **Specificity first**: select the handler that best fits the actual arguments; prefer
  - signatures with greater arity when all params match, unless trailing validators mark arguments as optional.
  - validators that perform stricter checks (e.g., tuple with fixed members beats array of unknown, literal/enum constraints beat plain primitives).
- **Tie-breaking**: when multiple signatures have equal specificity
  - prefer the one declared later to keep ergonomics predictable (explicit override).
  - if still tied, throw an ambiguity error to expose competing definitions.
- **Optional parameters**: validator opt-in (e.g., `optional()` flag) marks arguments optional; runtime should allow missing/undefined while still preferring longer matches when optional params are present.
- **Fallback handler**: executes only if no overload passes validation; must not mask genuine ambiguity.
- **Throws expectation**: `def(...).throws(ErrorType)` should trigger deterministic errors when matched; mismatching handler returning errors must surface clearly.

## 2. Validator Semantics
- Shared base contract:
  - `validate(value, ctx)` returns boolean, stores diagnostics.
  - `isTypeMatch(value)` used for coarse selection in scoring.
  - options include `optional`, `test(predicate)`.
- Primitive validators (`string`, `number`, `boolean`, `date`) support bounds/equality/pattern checks with accurate failure messages.
- Collections:
  - `array([...validators], opts)` ensures every element satisfies one of the validators, respects length constraints.
  - `tuple([...validators], opts)` enforces ordered validators, supports includes/equality for the full tuple.
- Object validators:
  - `shape({ prop: validator }, opts)` checks nested properties, optional/exhaustive behaviors, instance constraints.
  - `instance(Class, shape?)` ensures value is class instance plus optional shape validation.
- Function/type validators cover arity/name and constructor types.
- Union/composition support (e.g., `validatorA.or(validatorB)` or helper) must combine diagnostics and optional logic reliably.

## 3. Diagnostics & Errors
- Accumulate validator failures with clear identifiers (`Arg[name]`, `Element[index]`, etc.).
- Overload mismatch error reports:
  - targeted comparison of expected vs actual types (color/highlight optional, missing, extra args).
  - include nested validator messages indented for readability.
- Provide structured error objects for integration (e.g., expose machine-readable mismatch data for testing/logging).

## 4. TypeScript API Guarantees
- `def`/`overloads` generics yield precise tuple inference for arguments and return unions.
- Optional parameters map to `?` or union with `undefined` in the type layer consistent with runtime behavior.
- Validator factories expose types so consumers can reuse them in their own generic definitions.

## 5. Testing Expectations
- Resolver prioritization scenarios (prefix vs longer signature, optional params, unions).
- Per-validator success/failure cases, including edge conditions (regex, numeric bounds, instance checks).
- Diagnostics snapshots for representative failures.
- Performance sanity checks: ensure reasonable runtime for dozens of overloads with nested validators.

## 6. Non-goals / Stretch
- No requirement to support async predicate hooks in v1 (consider later).
- Backwards-compatible API names (`def`, `overloads`, validator factories) retained; behavior improvements documented as breaking changes if they alter prior outcomes.
