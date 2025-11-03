import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
	dts: false, // Use tsc post-build to emit declarations into dist/
});
