import { defineConfig } from "vitest/config";
import { autometa } from "@autometa/vitest-plugins";

export default defineConfig({
  plugins: [autometa()],
  resolve: {
    // Preserve symlinks so pnpm workspace links work correctly
    preserveSymlinks: true,
  },
  ssr: {
    // Don't externalize @cucumber/* packages - let Vite handle them as regular dependencies
    // This prevents Vite from creating virtual modules that break CommonJS internal requires
    noExternal: [
      '@cucumber/gherkin',
      '@cucumber/messages', 
      '@cucumber/cucumber-expressions'
    ]
  },
  test: {
    globals: true,
    environment: "node",
    passWithNoTests: true,
    include: ["**/*.feature"],
  },
});
