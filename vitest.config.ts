import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/legacy/**'],
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'json', 'html'],
    },
  },
});
