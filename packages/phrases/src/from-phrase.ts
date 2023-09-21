import { FromKey, ConfirmKey, AssertKey } from "@autometa/asserters";
import { convertPhrase } from "./convert-phrase";
import { StringTransformer } from "./string-transformer";
import { PhraseConverter } from "./types";
import { AnyFunction, Class } from "@autometa/types";

export function IsPhrase<
  TObj extends Record<string, unknown> | AnyFunction,
  TPhrase extends string,
  TMutations extends (() => StringTransformer)[]
>(item: TObj, key: TPhrase, ...mutations: TMutations) {
  const asVariable = convertPhrase(key, ...mutations);
  return ConfirmKey(item, asVariable);
}

export function AssertPhrase<
  TObj extends Record<string, unknown> | AnyFunction,
  TPhrase extends string,
  TMutations extends (() => StringTransformer)[]
>(item: TObj, key: TPhrase, ...mutations: TMutations) {
  const asVariable = convertPhrase(key, ...mutations);
  AssertKey(item, asVariable);
}

export type IFromPhrase<TDefault = unknown> = <T = TDefault>(
  key: string,
  ...mutations: (() => StringTransformer)[]
) => T;
export function FromPhrase(target: Class<unknown>) {
  target.prototype.fromPhrase = function (
    key: string,
    ...mutations: (() => StringTransformer)[]
  ) {
    return From(this).byPhrase(key, ...mutations);
  };
}

export function From<TObj extends Record<string, unknown> | AnyFunction>(
  obj: TObj
) {
  return {
    byPhrase(key: string, ...mutations: (() => StringTransformer)[]) {
      AssertPhrase(obj, key, ...mutations);
      const asVariable = convertPhrase(key, ...mutations);
      return FromKey(obj, asVariable) as TObj[keyof TObj];
    }
  };
}

export function AddPhraseImpl<T extends Record<string, unknown> | AnyFunction>(
  obj: T,
  transformer?: PhraseConverter
): T & { fromPhrase: PhraseConverter } {
  const func = transformer ?? FromPhrase.bind(obj).bind(obj);
  return Object.defineProperties(obj, {
    fromPhrase: {
      enumerable: false,
      configurable: false,
      writable: false,
      value: {
        get() {
          return func;
        }
      }
    }
  }) as unknown as T & { fromPhrase: PhraseConverter };
}

export function PhraseParser<T>(target: Class<T>) {
  target.prototype.fromPhrase = function (
    key: string,
    ...mutations: (() => StringTransformer)[]
  ) {
    return From(this).byPhrase(key, ...mutations);
  };
}
