import {
  AutometaWorld,
  Fixture,
  IFromPhrase,
  PhraseParser,
} from "@autometa/runner";

@PhraseParser
@Fixture
export class World extends AutometaWorld {
  foo: number;
  declare fromPhrase: IFromPhrase;
}
