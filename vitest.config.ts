import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['packages/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/legacy/**'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
});
