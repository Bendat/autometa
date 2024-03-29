import { Tag } from "@cucumber/messages";
import type { Modifiers, FrameworkTestCall, TestGroup } from "./types";
import parse from "@cucumber/tag-expressions";
import { Config } from "../config/config-manager";
export abstract class GherkinNode {
  abstract tags: string[];
  abstract get modifier(): Modifiers | undefined;

  protected takeTags(tags: Tag[], ...inherited: string[]) {
    this.tags = this.tags.concat(...inherited, ...tags.map((it) => it.name));
  }

  protected tagFilter(fn: FrameworkTestCall | TestGroup, modifiers?: Modifiers) {
    if (modifiers == "only") {
      return fn.only;
    }
    if (modifiers == "skip") {
      return fn.skip;
    }
    if (Config.has("tagFilter")) {
      const filter = Config.get("tagFilter");
      if (filter && !parse(Config.get("tagFilter")).evaluate(this.tags)) {
        return fn.skip;
      }
    }

    return fn;
  }
}
