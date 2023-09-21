import { PhraseParser, IFromPhrase } from "@autometa/phrases";

@PhraseParser
export class AutometaWorld {
  [key: string]: unknown;

  dfromPhrase: IFromPhrase;
}
