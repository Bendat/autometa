#!/usr/bin/env node

import { createCliProgram } from "./index";

async function main() {
  const program = await createCliProgram();
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

void main();
