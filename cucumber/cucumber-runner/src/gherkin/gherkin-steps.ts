import { KeywordType } from "./step-cache";
import { Docstring } from "./doc-string";

export class GherkinStep {
  constructor(
    readonly keywordType: KeywordType,
    readonly keyword: string,
    readonly text: string,
    readonly tableOrDocstring?: unknown | Docstring
  ) {}
}
