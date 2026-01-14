const SEPARATORS = /[\s_-]+/g;

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function splitWords(phrase: string): string[] {
  return phrase
    .trim()
    .split(SEPARATORS)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export function toCamelKey(phrase: string): string {
  const words = splitWords(phrase);
  if (words.length === 0) {
    return "";
  }
  const [first, ...rest] = words;
  return first + rest.map(capitalize).join("");
}

export function normalizeToken(phrase: string): string {
  return splitWords(phrase).join("");
}
