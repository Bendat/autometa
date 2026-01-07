import type { OrderItem } from "../../../../../.api/src/types/domain.js";

export type OrderPreferenceKind = "milk" | "sweetener";

export function normalizeOrderPreference(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function getOrderItemPreference(
  item: OrderItem,
  kind: OrderPreferenceKind
): { readonly raw: string; readonly normalized: string } {
  const raw = (kind === "milk" ? item.milk : item.sweetener) ?? "";
  return {
    raw,
    normalized: normalizeOrderPreference(raw),
  };
}

export function formatOrderItemPreferenceLabel(args: {
  readonly kind: OrderPreferenceKind;
  readonly expected: string;
  readonly actualRaw: string;
  readonly actualNormalized: string;
  readonly isNot: boolean;
}): string {
  const notText = args.isNot ? " not" : "";
  const expectedNormalized = normalizeOrderPreference(args.expected);

  // We include both raw and normalised values because domain inputs often
  // come from tables/docstrings and may include casing/whitespace.
  return [
    `order item ${args.kind} preference`,
    `(expected${notText}: "${args.expected}" → "${expectedNormalized}")`,
    `(actual: "${args.actualRaw}" → "${args.actualNormalized}")`,
  ].join(" ");
}
