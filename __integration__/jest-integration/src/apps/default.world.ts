import { AutometaWorld, IFromPhrase, PhraseParser } from "@autometa/runner";

@PhraseParser
export class World extends AutometaWorld {
    foo: number
    declare fromPhrase: IFromPhrase
}