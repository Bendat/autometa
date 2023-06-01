import { StringTransformers } from "@autometa/phrases";
import { FromPhrase } from "@autometa/assertions";
export class AutometaWorld {
  [key: string]: unknown;

  fromPhrase(phrase: string, ...transformers: StringTransformers) {
    return FromPhrase(this, phrase, ...transformers);
  }
}
