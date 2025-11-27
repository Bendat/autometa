import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.bundle.json",
  entryPoints: ["src/index.ts", "src/bin.ts"],
  dts: true
});
