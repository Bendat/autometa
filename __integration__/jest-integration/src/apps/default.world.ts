import { AutometaWorld, IFromPhrase, PhraseParser } from "@autometa/runner";

@PhraseParser
export class World extends AutometaWorld {
    declare fromPhrase: IFromPhrase
}