import { StringTransformers } from "./types";

/**
 * Converts a human friendly string into a structured
 * name, such as would be used in a variable or JSON
 * property name.
 *
 * The below example converts a sentence to camel case:
 *
 * ```ts
 * import { camel, convertPhrase } from '@autometa/phrases';
 * convertPhrase('foo bar baz', camel);
 * ```
 * which outputs `fooBarBaz`.
 *
 * It's also possible to add a prefix or suffix to the
 * converted phrase:
 * ```ts
 * import { camel, convertPhrase } from '@autometa/phrases';
 * convertPhrase('user', pfx`create`, sfx`response` camel);
 * ```
 * which outputs `createUserResponse`.
 * @param phrase
 * @param mutations
 * @returns
 */
export function convertPhrase<
  TPhrase extends string,
  TMutations extends StringTransformers
>(phrase: TPhrase, ...mutations: TMutations) {
  const constructed = mutations.map((cls) => cls());
  // const ordered = constructed.sort((a, b) => a.order - b.order);
  return constructed.reduce((acc, transformer) => {
    return transformer.transform(acc);
  }, phrase as string);
}
