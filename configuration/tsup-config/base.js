import { defineConfig } from "tsup";
import { readFileSync } from "fs";
import { resolve } from "path";

export const createTsupConfig = (options = {}) => {
  const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
  const external = [
    // Common dependencies that should remain external
    "react",
    "react-dom",
    "@types/node",
    "vitest",
    "typescript",
    /^@autometa\//,
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...(options.external || [])
  ];
  console.log("BASE CONFIG EXTERNAL:", external);
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
    
    // Override with user options
    ...options,
    
    // Ensure external is merged correctly
    external,
    
    esbuildOptions(options) {
      options.preserveSymlinks = true;
    }
  });
};

export default createTsupConfig();
