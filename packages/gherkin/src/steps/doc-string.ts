import { DocString as ds } from "@cucumber/messages";

export class DocString {
  readonly mediaType?: string;
  readonly content?: string;
  constructor({ mediaType, content }: ds) {
    this.mediaType = mediaType;
    this.content = content;
  }
}
