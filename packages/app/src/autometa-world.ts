import { StringTransformers, FromPhrase } from "@autometa/phrases";
export class AutometaWorld {
  [key: string]: unknown;

  fromPhrase(phrase: string, ...transformers: StringTransformers) {
    return FromPhrase(this, phrase, ...transformers);
  }
}
