import { assertKey, confirmKey, getKey } from "@autometa/asserters";
import type { Class } from "@autometa/types";
import { convertPhrase } from "./convert-phrase";
import type {
  CurriedPhraseConverter,
  PhraseConverter,
  PhraseTarget,
  PhraseTransformFactory,
} from "./types";

function resolveProperty(
  key: string,
  transforms: PhraseTransformFactory[]
): string {
  return convertPhrase(key, ...transforms);
}

export function isPhrase<
  TObj extends PhraseTarget,
  TPhrase extends string
>(
  item: TObj,
  key: TPhrase,
  ...mutations: PhraseTransformFactory[]
) {
  const property = resolveProperty(key, mutations);
  return confirmKey(item, property);
}

export const IsPhrase = isPhrase;

export function assertPhrase<
  TObj extends PhraseTarget,
  TPhrase extends string
>(
  item: TObj,
  key: TPhrase,
  ...mutations: PhraseTransformFactory[]
): void {
  const property = resolveProperty(key, mutations);
  assertKey(item, property);
}

export const AssertPhrase = assertPhrase;

export type IFromPhrase<TDefault = unknown> = CurriedPhraseConverter<TDefault>;

function createResolver(context: PhraseTarget): PhraseConverter {
  return (key, ...mutations) => from(context).byPhrase(key, ...mutations);
}

export function from<TObj extends PhraseTarget>(obj: TObj) {
  return {
    byPhrase<TResult = TObj[keyof TObj]>(
      key: string,
      ...mutations: PhraseTransformFactory[]
    ): TResult {
      assertPhrase(obj, key, ...mutations);
      const property = resolveProperty(key, mutations);
      return getKey(obj, property) as TResult;
    },
  };
}

export const From = from;

function defineLazyResolver(
  target: object,
  factory: (ctx: PhraseTarget) => PhraseConverter
): void {
  Object.defineProperty(target, "fromPhrase", {
    configurable: true,
    enumerable: false,
    get(this: PhraseTarget) {
      const resolver = factory(this);
      Object.defineProperty(this, "fromPhrase", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: resolver,
      });
      return resolver;
    },
  });
}

export function AddPhraseImpl<T extends PhraseTarget>(
  obj: T,
  transformer?: PhraseConverter
): T & { readonly fromPhrase: PhraseConverter } {
  if (transformer) {
    Object.defineProperty(obj, "fromPhrase", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: transformer,
    });
    return obj as T & { readonly fromPhrase: PhraseConverter };
  }

  defineLazyResolver(obj, createResolver);
  return obj as T & { readonly fromPhrase: PhraseConverter };
}

export function PhraseParser<T>(target: Class<T>): void {
  defineLazyResolver(target.prototype, createResolver);
}

export function FromPhrase(target: Class<unknown>): void {
  defineLazyResolver(target.prototype, createResolver);
}
