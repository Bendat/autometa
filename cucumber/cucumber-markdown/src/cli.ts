#!/usr/bin/env node
import { program } from "commander";
import { TransformOptions } from "./file-system";
import { getFeatureFiles, writeMarkdownFiles } from "./file-system";

program
  .name("Cucumber Markdown")
  .description("Converts feature files to markdown files")
  .argument(
    "<input file or directory>",
    "The root input directory where feature files are located"
  )
  .argument(
    "<output directory>",
    "Target root input directory where markdown files will be written. "
  )
  .option(
    "-v, --verbose <boolean>",
    "If true, logs show files being read and written",
    false
  )
  .option(
    "-f, --flatten <boolean>",
    "If true, flattens output directory structure to a depth of 1",
    false
  )
  .option(
    "-o, --overwrite <boolean>",
    "If true, overwrites existing markdown files",
    true
  );

program.parse();

async function run() {
  const options: TransformOptions = program.opts();
  const [input, output] = program.args;
  const files = await getFeatureFiles(input);
  await Promise.all(writeMarkdownFiles(output, files, options));
}

run();
