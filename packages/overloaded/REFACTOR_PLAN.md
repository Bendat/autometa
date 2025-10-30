<!-- cspell:disable -->

# Overloaded Refactor Plan

## Behavioral Goals
- Support declarative overload definitions via `def(...)` returning handler entries consumed by `overloads(...).use(args)`.
- Validators must enforce type constraints, optionality, and custom predicates while emitting clear diagnostics using accumulators.
- Overload resolution must prefer the most specific signature (respecting arity and validator specificity) and only fall back when no matches succeed.
- Provide structured error reporting when nothing matches, including per-argument mismatch context.
- Maintain strong TypeScript inference so handler signatures and return unions remain accurate.

## Action Plan
1. **Capture Requirements**
   - Formalize overload resolution rules (specificity scoring, arity handling, optional semantics).
   - Catalogue validator capabilities and edge cases to retain or improve.
   - Define the diagnostic format and logging hooks required by consumers.
   - Produce a concise requirements spec summarizing the above for ongoing reference.
2. **Design Matching Engine**
   - Prototype scoring/tie-breaking strategy for candidate overloads.
   - Decide how fallback and `throws` entries integrate with the main resolver.
   - Sketch data structures for normalized signatures and cached validator metadata.
3. **Rebuild Validator Library**
   - Redesign the base validator contract (optional handling, accumulator lifecycle).
   - Reimplement scalar/collection/object validators with bug fixes and clearer messaging.
   - Add composition utilities for unions, shapes, instances, and custom predicates.
4. **TypeScript Surface**
   - Align runtime changes with updated generics/inference helpers.
   - Document intentional API changes and plan migration notes if behaviour shifts.
5. **Testing Strategy**
   - Draft a matrix covering resolver prioritization, validator success/failure, fallback/throws semantics, and regression bugs (e.g., prefix matches beating more specific signatures).
   - Include snapshot-style diagnostics to guard error messaging.
6. **Implementation Roadmap**
   - Build matcher core, then port validators incrementally with targeted tests.
   - Integrate typings, ensure builds, and update docs/examples.
7. **Review & Hardening**
   - Profile critical paths for performance concerns.
   - Audit developer experience (API ergonomics, error clarity).
   - Prepare release notes and versioning steps for the 1.0 refactor.

## Requirements Snapshot
- **Overload resolution**
   - Score candidates by arity match and validator strictness so the most specific signature wins.
   - Honour optional parameters while still preferring full matches when extra args are provided.
   - Resolve ties deterministically and raise on genuine ambiguity.
   - Execute `fallback` only when no signature succeeds.
- **Validator capabilities**
   - Provide scalar, collection, object, function, and instance validators with optional flags, custom predicates, and composition helpers.
   - Ensure unions merge diagnostics correctly and no validator silently accepts invalid input (fixes for date/number/tuple/unknown noted earlier).
- **Diagnostics**
   - Collect human-friendly failure messages with identifiers (`Arg[name]`, `Element[index]`, etc.).
   - Surface structured mismatch data so consumers can log or snapshot reports in tests.
- **TypeScript guarantees**
   - Preserve precise tuple inference for `def`/`overloads` and align runtime optional behaviour with the type layer.
   - Expose validator types for reuse in consuming code.
- **Testing**
   - Build scenarios covering prefix vs longer matches, optional arguments, unions, and fallback/throws behaviour.
   - Capture regression cases for known bugs (e.g., prefix match beating more specific signatures, broken validators).

   <!-- cspell:enable -->
