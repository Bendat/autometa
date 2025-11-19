import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*',
  'examples/*',
  {
    test: {
      include: ['packages/**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/legacy/**'],
      coverage: {
        provider: 'v8',
        reporter: ['json-summary', 'json', 'html'],
        thresholds: {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  },
]);