import type pcModule from "picocolors";

export type DuplicatePolicy = "error" | "skip" | "create-new" | "prompt";

export interface CandidateCase {
  readonly id: number;
  readonly suiteName?: string;
  readonly sectionPath?: string;
  readonly title?: string;
  readonly signature?: string;
  readonly firstStep?: string;
}

export interface ResolveDuplicateOptions {
  readonly policy: DuplicatePolicy;
  readonly candidates: readonly CandidateCase[];
  readonly signature?: string;
  readonly pc: typeof pcModule;
  /** If true and TTY is unavailable, treat prompt as error; otherwise fallback to policy="error" behavior. */
  readonly interactive?: boolean;
  /** Maximum candidates to show in prompt; above this, fail unless forcePrompt is set. */
  readonly maxPromptCandidates?: number;
  readonly forcePrompt?: boolean;
}

export type DuplicateResolution =
  | { readonly action: "use"; readonly caseId: number }
  | { readonly action: "create" }
  | { readonly action: "skip" }
  | { readonly action: "error"; readonly message: string };

export async function resolveDuplicate(options: ResolveDuplicateOptions): Promise<DuplicateResolution> {
  const { policy, candidates, signature, pc, interactive = true, maxPromptCandidates = 10, forcePrompt } = options;

  if (candidates.length <= 1 && policy !== "prompt") {
    const only = candidates[0];
    return only ? { action: "use", caseId: only.id } : { action: "create" };
  }

  switch (policy) {
    case "error":
      return { action: "error", message: buildError("Multiple matches", candidates, signature) };
    case "skip":
      return { action: "skip" };
    case "create-new":
      return { action: "create" };
    case "prompt": {
      if (!interactive || !process.stdout.isTTY) {
        return { action: "error", message: "Cannot prompt in non-interactive environment." };
      }
      if (candidates.length > maxPromptCandidates && !forcePrompt) {
        return {
          action: "error",
          message: `Too many matches (${candidates.length}) to prompt safely. Pass --force-prompt to override or refine your filters.`,
        };
      }
      return promptUser(candidates, pc, signature);
    }
  }
}

async function promptUser(candidates: readonly CandidateCase[], pc: typeof pcModule, signature?: string): Promise<DuplicateResolution> {
  // The Enquirer type definitions do not surface Select cleanly via dynamic import; cast to any for runtime Select usage.
  const Select = (await import("enquirer")) as unknown as { new (opts: unknown): { run(): Promise<unknown> } };

  const choices = [
    ...candidates.map((c) => ({
      name: String(c.id),
      message: formatCandidate(c, pc),
      value: { action: "use", caseId: c.id } as const,
    })),
    { name: "create-new", message: pc.green("Create new case"), value: { action: "create" } as const },
    { name: "skip", message: pc.yellow("Skip this scenario"), value: { action: "skip" } as const },
  ];

  const prompt = new Select({
    name: "duplicate-resolution",
    message: buildPromptMessage(signature),
    choices,
  });

  const answer = (await prompt.run()) as DuplicateResolution;
  return answer;
}

function buildPromptMessage(signature?: string): string {
  return signature
    ? `Multiple matches found for ${signature}. Choose one to reuse or create new:`
    : "Multiple matches found. Choose one to reuse or create new:";
}

function formatCandidate(candidate: CandidateCase, pc: typeof pcModule): string {
  const parts = [
    pc.cyan(`#${candidate.id}`),
    candidate.suiteName ? pc.gray(`suite:${candidate.suiteName}`) : undefined,
    candidate.sectionPath ? pc.gray(`section:${candidate.sectionPath}`) : undefined,
    candidate.title ? candidate.title : undefined,
    candidate.firstStep ? pc.dim(candidate.firstStep) : undefined,
    candidate.signature ? pc.gray(candidate.signature.slice(0, 24)) : undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

function buildError(label: string, candidates: readonly CandidateCase[], signature?: string): string {
  const summary = candidates
    .slice(0, 5)
    .map((c) => `#${c.id}${c.title ? ` ${c.title}` : ""}${c.sectionPath ? ` [${c.sectionPath}]` : ""}`)
    .join(", ");
  const suffix = candidates.length > 5 ? ` …and ${candidates.length - 5} more` : "";
  return `${label}: ${signature ?? "(no signature)"}. Candidates: ${summary}${suffix}`;
}
