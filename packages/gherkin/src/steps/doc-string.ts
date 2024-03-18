import { DocString } from "@cucumber/messages";

export class GherkinDocString {
  readonly mediaType?: string;
  readonly content?: string;
  constructor({ mediaType, content }: DocString) {
    this.mediaType = mediaType;
    this.content = content;
  }
}
