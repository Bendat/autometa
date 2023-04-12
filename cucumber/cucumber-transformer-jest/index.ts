import crypto from "crypto";

import { transform } from "@babel/core";
import type { Config } from "@jest/types";
import jestPreset from "babel-preset-jest";

export let canInstrument: false;
export const getCacheKey = (
  fileData: crypto.BinaryLike,
  filename: crypto.BinaryLike,
  configString: crypto.BinaryLike,
  instrument: { instrument?: crypto.BinaryLike }
) =>
  crypto
    .createHash("md5")
    .update("\0", "utf8")
    .update(fileData)
    .update("\0", "utf8")
    .update(filename)
    .update("\0", "utf8")
    .update("\0", "utf8")
    .update("\0", "utf8")
    .update(instrument ? "instrument" : "")
    .digest("hex");

export default {
  getCacheKey,
  process: (src: string, filePath: string, jestConfig: Config.ProjectConfig) => {
    const testFile = `
const { Feature } = require('@autometa/cucumber-runner');            
Feature('${filePath}')
`;

    const featureFile = transform(testFile, {
      filename: filePath,
      presets: [jestPreset],
      root: jestConfig.cwd,
    });

    return featureFile;
  },
};
