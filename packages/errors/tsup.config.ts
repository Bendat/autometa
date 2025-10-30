import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  dts: false, // Generate dts manually with tsc instead
});
