import { AmbiguousOverloadError, NoOverloadMatchedError } from "./errors";
import { normalizeSignatures, type SignatureDefinitionInput } from "./signature";
import type {
  MatchScore,
  NormalizedSignature,
  SignatureFailureReport,
  ValidationIssue,
  ValidationResult,
  ValidationPath,
} from "./types";

type EvaluationResult =
  | {
      ok: true;
      score: MatchScore;
    }
  | {
      ok: false;
      issues: ValidationIssue[];
    };

export class Matcher {
  private readonly signatures: NormalizedSignature[];
  private readonly fallback: NormalizedSignature | undefined;

  constructor(signatures: ReadonlyArray<NormalizedSignature>) {
    const normalized = [...signatures];
    const fallback = normalized.find((signature) => signature.fallback);
    this.fallback = fallback;
    this.signatures = normalized.filter((signature) => !signature.fallback);
  }

  static from(definitions: ReadonlyArray<SignatureDefinitionInput>): Matcher {
    const signatures = normalizeSignatures(definitions);
    return new Matcher(signatures);
  }

  use(args: unknown[]): unknown {
    const matches: Array<{ signature: NormalizedSignature; score: MatchScore }> = [];
    const failures: SignatureFailureReport[] = [];

    for (const signature of this.signatures) {
      const evaluation = this.evaluateSignature(signature, args);
      if (evaluation.ok) {
        matches.push({ signature, score: evaluation.score });
      } else {
        failures.push({
          signature,
          issues: evaluation.issues,
          expected: signature.validators.map((validator) =>
            validator.optional ? `${validator.summary}?` : validator.summary
          ),
        });
      }
    }

    if (matches.length === 0) {
      if (this.fallback?.handler) {
        return this.fallback.handler(...args);
      }
      throw new NoOverloadMatchedError(args, failures);
    }

    const bestScore = this.getBestScore(matches.map((match) => match.score));
    const bestMatches = matches.filter((match) => isSameScore(match.score, bestScore));

    if (bestMatches.length > 1) {
      throw new AmbiguousOverloadError(
        "Multiple overloads match with identical specificity",
        bestMatches.map((match) => match.signature)
      );
    }

    const [winnerEntry] = bestMatches;
    if (!winnerEntry) {
      throw new Error("Unable to resolve a matching overload despite scoring.");
    }
    const { signature: winner } = winnerEntry;

    if (winner.throws) {
      const { error, message } = winner.throws;
      throw new error(message);
    }

    if (!winner.handler) {
      throw new Error("Matched overload does not have an associated handler");
    }

    return winner.handler(...args);
  }

  private evaluateSignature(signature: NormalizedSignature, args: unknown[]): EvaluationResult {
    const issues: ValidationIssue[] = [];

    if (args.length < signature.minArity || args.length > signature.maxArity) {
      issues.push({
        path: [],
        message: `Received ${args.length} arguments, expected between ${signature.minArity} and ${signature.maxArity}`,
        expected: `${signature.minArity}-${signature.maxArity}`,
        actual: args.length,
      });
      return { ok: false, issues };
    }

    for (const [index, validator] of signature.validators.entries()) {
      const value = args[index];
      const path: ValidationPath = ["arg", index];

      if (value === undefined && index >= args.length) {
        if (!validator.optional) {
          issues.push({ path, message: "Argument is required but missing", expected: validator.summary });
          return { ok: false, issues };
        }
        continue;
      }

      if (value === undefined && validator.optional) {
        continue;
      }

      const result: ValidationResult = validator.validate(value, path);
      if (!result.ok) {
        issues.push(...result.issues);
        return { ok: false, issues };
      }
    }

    if (args.length > signature.validators.length) {
      const extraArgs = args.length - signature.validators.length;
      for (let offset = 0; offset < extraArgs; offset++) {
        const index = signature.validators.length + offset;
        issues.push({
          path: ["arg", index],
          message: "Unexpected argument",
          actual: args[index],
        });
      }
      return { ok: false, issues };
    }

    const score: MatchScore = [
      signature.specificity,
      signature.requiredArity,
      args.length === signature.validators.length ? 1 : 0,
      signature.id,
    ];

    return { ok: true, score };
  }

  private getBestScore(scores: MatchScore[]): MatchScore {
    return scores.reduce((best, current) => {
      if (compareScores(current, best) > 0) {
        return current;
      }
      return best;
    });
  }
}

function compareScores(a: MatchScore, b: MatchScore): number {
  const [aSpecificity, aRequiredArity, aExactArity, aOrder] = a;
  const [bSpecificity, bRequiredArity, bExactArity, bOrder] = b;

  if (aSpecificity !== bSpecificity) {
    return aSpecificity > bSpecificity ? 1 : -1;
  }

  if (aRequiredArity !== bRequiredArity) {
    return aRequiredArity > bRequiredArity ? 1 : -1;
  }

  if (aExactArity !== bExactArity) {
    return aExactArity > bExactArity ? 1 : -1;
  }

  if (aOrder !== bOrder) {
    return aOrder > bOrder ? 1 : -1;
  }

  return 0;
}

function isSameScore(a: MatchScore, b: MatchScore): boolean {
  return compareScores(a, b) === 0;
}
