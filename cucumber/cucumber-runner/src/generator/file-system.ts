import path from "path";
import { writeFileSync, existsSync, promises } from "fs";
import glob from "glob";
export function getFeatureFiles(pathGlob: string) {
  if (path.extname(pathGlob) == ".feature") {
    return [pathGlob];
  }
  return glob.sync(path.join(pathGlob, "*/*.feature"));
}
export interface TransformOptions {
  generate: boolean;
  overwrite: boolean;
  verbose: boolean;
  flatten: boolean;
}

export function writeTestFiles(
  outDir: string,
  inDir: string,
  features: string[],
  options?: TransformOptions
) {
  return features.map(async (feature) => {
    // const text = readFileSync(feature, "utf-8");
    const featurePath = feature.replace(".feature", ".feature.ts").replace(inDir, "");
    const featureFileName = path.basename(featurePath);

    const configuredOut = options?.flatten ? featureFileName : featurePath;
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
    const testFile = `import { Feature } from '@autometa/cucumber-runner'
Feature('${path.relative(out, feature).replace("../", "")}')`;
    writeFileSync(out, testFile);
    if (options?.verbose) {
      console.log(`${feature}
  --> ${out}`);
    }
    return out;
  });
}
