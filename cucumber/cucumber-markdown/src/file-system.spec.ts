import { test } from "vitest";
import {
  getFeatureFiles,
  TransformOptions,
  writeMarkdownFiles,
} from "./file-system";

test("glob", async () => {
  const x = await getFeatureFiles("./");
  const option: TransformOptions = {
    overwrite: true,
    verbose: true,
    flatten: false,
    collapse: false,
  };
  await Promise.all(writeMarkdownFiles("./out", x, option));
});
