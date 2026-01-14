/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  rootDir: __dirname,
  testMatch: ["<rootDir>/integration/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@autometa/config$": "<rootDir>/../config/src/index.ts",
    "^@autometa/executor$": "<rootDir>/../executor/src/index.ts",
    "^@autometa/gherkin$": "<rootDir>/../gherkin/src/index.ts",
    "^@autometa/scopes$": "<rootDir>/../scopes/src/index.ts",
    "^@autometa/test-builder$": "<rootDir>/../test-builder/src/index.ts",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
        isolatedModules: false,
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [],
};
