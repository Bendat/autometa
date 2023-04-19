import path from "path";
import { readFileSync, writeFileSync, existsSync, promises } from "node:fs";
import {
  convertFeatureToMarkdown,
  convertToMarkdown,
  serialize,
} from "./transformer";
import glob from "glob";
import {
  Feature,
  FeatureChild,
  GherkinDocument,
  Rule,
  RuleChild,
} from "@cucumber/messages";
import _ from "lodash";
export function getFeatureFiles(pathGlob: string) {
  if (path.extname(pathGlob) == ".feature") {
    return [pathGlob];
  }
  return glob.sync(path.join(pathGlob, "**/*.feature"));
}
export interface TransformOptions {
  overwrite: boolean;
  verbose: boolean;
  flatten: boolean;
  collapse: boolean;
}

export async function collapseMarkdownFiles(
  outDir: string,
  features: string[],
  options?: TransformOptions
) {
  const map: Map<string, GherkinDocument[]> = new Map();
  await Promise.all(
    features.map(async (feature) => {
      const text = readFileSync(feature, "utf-8");
      const obj = serialize(text);
      const name = obj.feature?.name;
      if (name && !map.has(name)) {
        map.set(name ?? "no name provided", []);
      }
      map.get(name ?? "no name provided")?.push(obj);
    })
  );
  const compiledFeatures: Feature[] = [];
  for (const key of map.keys()) {
    const arr = map.get(key) ?? [];
    const description =
      arr && arr.length > 0
        ? arr
            .map((feature) => feature.feature?.description)
            ?.filter((it) => it)
            .join()
        : undefined;

    const feature = new Feature();
    const featureChildren: FeatureChild[] = [];
    feature.children = featureChildren;
    if (description) {
      feature.description = description;
    }
    feature.name = arr[0]?.feature?.name ?? "no name given";
    const scenarios = (arr?.flatMap((it) =>
      it.feature?.children.filter((it) => it.background || it.scenario)
    ) ?? []) as FeatureChild[];
    featureChildren.push(...scenarios);
    const rules = arr
      ?.map((features) =>
        (features.feature?.children ?? []).filter((child) =>
          Reflect.has(child, "rule")
        )
      )
      .map((it) => it as FeatureChild[]);

    const flatRules = rules?.flatMap((ruleGroup) => {
      const description = ruleGroup
        .map((rule) => rule?.rule?.description)
        .join();
      if (!ruleGroup[0]?.rule) {
        return;
      }
      const combinedRule = new Rule();
      combinedRule.name = ruleGroup[0]?.rule?.name ?? "no name provided";
      const childArr: RuleChild[] = [];
      combinedRule.children = childArr;
      combinedRule.description = description;
      for (const rule of ruleGroup) {
        childArr.push(...(rule?.rule?.children ?? []));
      }
      combinedRule.children = childArr;
      return { rule: combinedRule } as FeatureChild;
    }) as FeatureChild[];
    featureChildren.push(...flatRules.filter((it) => it));
    compiledFeatures.push(feature);
  }
  const mapped = compiledFeatures.map(async (feature) => {
    const markdown = convertFeatureToMarkdown(feature);
    const markdownPath = path.join(outDir, `${_.kebabCase(feature.name)}.md`);
    const markdownFile = path.basename(markdownPath);
    const configuredOut = markdownFile;
    const out = path.join(outDir, configuredOut);
    if (existsSync(out) && !options?.overwrite) {
      if (options?.verbose) {
        console.log(`File already exists. Skipping: ${out}`);
      }
      return out;
    }
    if (!existsSync(path.dirname(out))) {
      if (options?.verbose) {
        console.log(`Creating directory ${path.dirname(out)}`);
      }
      await promises.mkdir(path.dirname(out), { recursive: true });
    }
    writeFileSync(out, markdown);
    if (options?.verbose) {
      console.log(`${feature}
  --> ${out}`);
    }
    return out;
  });
  return Promise.all(mapped);
}

export function writeMarkdownFiles(
  outDir: string,
  features: string[],
  options?: TransformOptions
) {
  return features.map(async (feature) => {
    const text = readFileSync(feature, "utf-8");
    const markdown = convertToMarkdown(text);
    const markdownPath = feature.replace(".feature", ".md");
    const markdownFile = path.basename(markdownPath);
    const configuredOut = options?.flatten ? markdownFile : markdownPath;
    const out = path.join(outDir, configuredOut);
    if (existsSync(out) && !options?.overwrite) {
      if (options?.verbose) {
        console.log(`File already exists. Skipping: ${out}`);
      }
      return out;
    }
    if (!existsSync(path.dirname(out))) {
      if (options?.verbose) {
        console.log(`Creating directory ${path.dirname(out)}`);
      }
      await promises.mkdir(path.dirname(out), { recursive: true });
    }
    writeFileSync(out, markdown);
    if (options?.verbose) {
      console.log(`${feature}
  --> ${out}`);
    }
    return out;
  });
}
