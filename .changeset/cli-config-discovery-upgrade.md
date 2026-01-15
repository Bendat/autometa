---
"@autometa/cli": minor
---

feat(cli): add --config flag and enhance config discovery

- New `--config` / `-c` flag to point the CLI at a specific Autometa config file.
- Broader default discovery: searches upward from the current directory for:
  - `autometa.config.{ts,mts,cts,js,mjs,cjs}`
  - `autometa.<name>.config.{ts,mts,cts,js,mjs,cjs}` (e.g. `autometa.e2e.config.ts`)
- This improves "global install" usage and aligns config ergonomics with tools like Vitest/Jest.
