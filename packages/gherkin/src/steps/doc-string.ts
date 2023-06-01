import { DocString} from "@cucumber/messages";

export class GherkinDocString {
  readonly mediaType?: string;
  readonly content?: string;
  constructor({ mediaType, content }: DocString) {
    this.mediaType = mediaType;
    this.content = content;
  }
  
  toString(): string {
    return this.content || "";
  }
  valueOf(): string {
    return this.content || "";
  }
  [Symbol.toPrimitive](): string {
    return this.content || "";
  }
}
