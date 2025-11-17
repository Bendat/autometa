import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.build.json",
  entryPoints: ["src/index.ts", "src/bin.ts"],
  dts: true
});
