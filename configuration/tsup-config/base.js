import { defineConfig } from "tsup";

export const createTsupConfig = (options = {}) => {
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
    external: [
      // Common dependencies that should remain external
      "react",
      "react-dom",
      "@types/node",
      "vitest",
      "typescript",
      ...(options.external || [])
    ],
    
    // TypeScript settings - generate declaration files
    dts: true,
    
    // Override with user options
    ...options,
  });
};

export default createTsupConfig();
