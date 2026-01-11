import type { TestRailCase } from "./client";
import type { ExistingCase } from "./matcher";

const SIGNATURE_RE = /\bautometa:[0-9a-f]{64}\b/i;

export function extractSignatureFromRefs(refs?: string): string | undefined {
  if (!refs) return undefined;
  const m = refs.match(SIGNATURE_RE);
  return m ? m[0] : undefined;
}

export function ensureRefsContain(refs: string | undefined, token: string): string {
  const parts = new Set(
    (refs ?? "")
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
  parts.add(token);
  return Array.from(parts).join(" ");
}

export function toExistingCaseFromTestRail(c: TestRailCase): ExistingCase {
  const signature = extractSignatureFromRefs(typeof c.refs === "string" ? c.refs : undefined);
  const firstStep = Array.isArray(c.custom_steps_separated)
    ? (c.custom_steps_separated[0]?.content ?? "").toString()
    : undefined;

  return {
    id: c.id,
    title: c.title,
    ...(signature !== undefined ? { signature } : {}),
    ...(firstStep ? { firstStep } : {}),
  };
}
