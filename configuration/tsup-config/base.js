import { defineConfig } from "tsup";

/**
 * Esbuild plugin that forces @autometa/* imports to stay external.
 * This runs before tsconfig path resolution, so even if paths alias
 * @autometa/foo to a relative file, we intercept the bare specifier
 * and mark it external immediately.
 */
const externalAutometaPlugin = {
  name: "external-autometa",
  setup(build) {
    build.onResolve({ filter: /^@autometa\// }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

export const createTsupConfig = (options = {}) => {
  // Destructure so we can merge arrays instead of replacing
  const { external: userExternal = [], esbuildPlugins: userPlugins = [], ...rest } = options;

  return defineConfig({
    // Core settings
    clean: true,
    format: ["cjs", "esm"],
    sourcemap: true,
    skipNodeModulesBundle: true,

    // Performance optimizations
    target: "es2020",
    outDir: "dist",
    splitting: false, // Disable code splitting for libraries
    treeshake: true,

    // Entry points
    entryPoints: ["src/index.ts"],

    // Bundle analysis
    metafile: false,

    // Override external deps to reduce bundle size
    // Merge shared externals with per-package externals
    external: [
      // Common dependencies that should remain external
      "react",
      "react-dom",
      "@types/node",
      "vitest",
      "typescript",
      /^@autometa\//,
      ...userExternal,
    ],

    // Inject esbuild plugin to guarantee @autometa/* stays external
    esbuildPlugins: [externalAutometaPlugin, ...userPlugins],

    // TypeScript settings - generate declaration files
    dts: true,

    // Override with remaining user options (won't clobber external/plugins now)
    ...rest,
  });
};

export default createTsupConfig();
