import { DocString } from "@cucumber/messages";

export class Docstring {
  readonly mediaType?: string;
  readonly content?: string;
  constructor({ mediaType, content }: DocString) {
    this.mediaType = mediaType;
    this.content = content;
  }
}
