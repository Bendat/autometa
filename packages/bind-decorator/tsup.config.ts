import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
	dts: false, // Emit declarations via tsc post-build for consistency.
});
