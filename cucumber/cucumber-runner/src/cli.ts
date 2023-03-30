#!/usr/bin/env node
import { program } from "commander";
import { TransformOptions } from "./generator/file-system";
import { getFeatureFiles, writeTestFiles } from "./generator/file-system";

program
  .name("Cucumber Runner")
  .description("Converts feature files to markdown files")
  .option("-g, --generate", "If true, flattens output directory structure to a depth of 1", true)
  .argument("<input file or directory>", "The root input directory where feature files are located")
  .argument("<output directory>", "Target root input directory where test files will be written. ")
  .option("-v, --verbose <boolean>", "If true, logs show files being read and written", false)
  .option(
    "-f, --flatten <boolean>",
    "If true, flattens output directory structure to a depth of 1",
    false
  )
  .option("-o, --overwrite <boolean>", "If true, overwrites existing test files", false);

program.parse();

async function run() {
  const options: TransformOptions = program.opts();
  const [input, output] = program.args;
  if (!options.generate) {
    return;
  }
  const files = getFeatureFiles(input);
  await Promise.all(writeTestFiles(output, input, files, options));
}

run();
