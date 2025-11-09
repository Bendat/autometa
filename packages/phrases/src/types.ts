import type { AnyFunction } from "@autometa/types";

/**
 * Describes a concrete transformation that mutates a phrase.
 */
export interface PhraseTransform {
  readonly name: string;
  readonly apply: (value: string) => string;
  readonly kind?: "case" | "prefix" | "suffix" | "sanitize" | "custom";
}

/**
 * Factory that produces a new {@link PhraseTransform} instance.
 */
export type PhraseTransformFactory = () => PhraseTransform;

export type PhraseTransforms = ReadonlyArray<PhraseTransformFactory>;

export type PhraseConverter = (
  key: string,
  ...mutations: PhraseTransformFactory[]
) => string;

export type CurriedPhraseConverter<TDefault = unknown> = <T = TDefault>(
  key: string,
  ...mutations: PhraseTransformFactory[]
) => T;

export type PhraseTarget = Record<string, unknown> | AnyFunction;
