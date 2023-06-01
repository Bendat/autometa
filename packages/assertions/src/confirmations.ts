import { AutomationError } from "@autometa/errors";
import { closestMatch } from "closest-match";
import { StringTransformer, convertPhrase } from "@autometa/phrases";
import { ExtractLiteralFromObject } from "./types";

// type AssertionBranch<T> = T extends string ?
export function IsKey<TObj>(
  item: TObj,
  key: string | keyof TObj
): asserts key is keyof TObj {
  if (item === null || item === undefined) {
    throw new AutomationError(
      `Item cannot be null or undefined if indexing for values. ${String(
        key
      )} is not a valid property of ${item}`
    );
  }
  if (!(typeof item === "object" || typeof item === "function")) {
    throw new AutomationError(
      `A key can only be valid for a value whose type is object or function: Type ${typeof item} is not valid`
    );
  }
  if (key && typeof key == "string" && key in item) {
    return;
  }
  const matches = closestMatch(key as string, Object.keys(item), true) ?? [];
  throw new AutomationError(
    `Key ${String(key)} does not exist on target ${item}.
  These keys are similar. Did you mean one of these?: 
  ${Array.isArray(matches) ? matches.join("\n") : matches}`
  );
}

export function FromKey<TReturn>(item: Record<string, unknown>, key: string) {
  IsKey(item, key);
  return item[key] as TReturn;
}
export function FromLiteral<
  TObj extends Record<string, unknown>,
  TPhrase extends string
>(item: TObj, key: TPhrase): ExtractLiteralFromObject<TObj, TPhrase> {
  IsKey(item, key);
  return item[key] as ExtractLiteralFromObject<TObj, TPhrase>;
}

export function IsPhrase<
  TObj,
  TPhrase extends string,
  TMutations extends (() => StringTransformer)[]
>(item: TObj, key: TPhrase, ...mutations: TMutations) {
  const asVariable = convertPhrase(key, ...mutations);
  IsKey(item, asVariable);
}

export function FromPhrase<TReturn>(
  item: Record<string, unknown>,
  key: string,
  ...mutations: (() => StringTransformer)[]
) {
  const asVariable = convertPhrase(key, ...mutations);
  IsKey(item, asVariable);
  return item[asVariable] as TReturn;
}
