import path from "node:path";
import { readFileSync, writeFileSync, existsSync, promises } from "node:fs";
import { convertToMarkdown } from "./transformer";
import glob from "glob";
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
