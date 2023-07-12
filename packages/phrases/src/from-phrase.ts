import { FromKey, ConfirmKey, AssertKey } from "@autometa/asserters";
import { convertPhrase } from "./convert-phrase";
import { StringTransformer } from "./string-transformer";
import { PhraseConverter } from "./types";
import { AnyFunction } from "@autometa/types";
export function IsPhrase<
  TObj,
  TPhrase extends string,
  TMutations extends (() => StringTransformer)[]
>(item: TObj, key: TPhrase, ...mutations: TMutations) {
  const asVariable = convertPhrase(key, ...mutations);
  ConfirmKey(item, asVariable);
}
export function AssertPhrase<
  TObj extends Record<string, unknown> | AnyFunction,
  TPhrase extends string,
  TMutations extends (() => StringTransformer)[]
>(item: TObj, key: TPhrase, ...mutations: TMutations) {
  const asVariable = convertPhrase(key, ...mutations);
  AssertKey(item, asVariable);
}
export function FromPhrase<TReturn>(
  item: Record<string, unknown> | AnyFunction,
  key: string,
  ...mutations: (() => StringTransformer)[]
) {
  const asVariable = convertPhrase(key, ...mutations);
  return FromKey(item, asVariable) as TReturn;
}

export function AddPhraseImpl<T extends Record<string, unknown> | AnyFunction>(
  obj: T,
  transformer?: PhraseConverter
): T & { phrase: PhraseConverter } {
  const func = transformer ?? FromPhrase.bind(obj, obj);
  return Object.defineProperties(obj, {
    phrase: {
      enumerable: false,
      configurable: false,
      writable: false,
      value: {
        get() {
          return func;
        }
      }
    }
  }) as unknown as T & { phrase: PhraseConverter };
}
