import { createRequire } from "node:module";

import { Command } from "commander";

import { registerRunCommand } from "./commands/run";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version?: string };

export async function createCliProgram(): Promise<Command> {
  const program = new Command();
  program
    .name("autometa")
    .description("Autometa command-line runner")
    .version(version ?? "0.0.0");

  registerRunCommand(program);

  return program;
}

export { runFeatures } from "./commands/run";
