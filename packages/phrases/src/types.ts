import type { StringTransformer } from "./string-transformer";

export type StringTransformers = (() => StringTransformer)[];

export type TimeUnit =  'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export type PhraseConverter = (key: string, ...transformers: StringTransformers) => string;