import { PhraseTransformFactory, PhraseTransform } from "./types";

const WHITESPACE_PATTERN = /\s+/g;

function normaliseWhitespace(value: string): string {
  return value.replace(WHITESPACE_PATTERN, " ").trim();
}

function materialiseTransform(
  factory: PhraseTransformFactory,
  index: number
): PhraseTransform {
  if (typeof factory !== "function") {
    throw new TypeError(
      `Phrase transform at index ${index} is not a factory function.`
    );
  }

  const transform = factory();
  if (!transform || typeof transform.apply !== "function") {
    throw new TypeError(
      `Phrase transform factory at index ${index} returned an invalid transform.`
    );
  }

  return transform;
}

export function convertPhrase(
  phrase: string,
  ...factories: PhraseTransformFactory[]
): string {
  if (typeof phrase !== "string") {
    throw new TypeError("convertPhrase expects the phrase argument to be a string.");
  }

  if (factories.length === 0) {
    return phrase;
  }

  let result = normaliseWhitespace(phrase);

  factories.forEach((factory, index) => {
    const transform = materialiseTransform(factory, index);
    const next = transform.apply(result);
    if (typeof next !== "string") {
      throw new TypeError(
        `Phrase transform '${transform.name}' did not return a string result.`
      );
    }

    result = next;
  });

  return result;
}
