// import type { Config } from "@jest/types";
// Sync object
const config = {
  setupFilesAfterEnv: ["reflect-metadata"],
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@gherkin/(.*)$": "<rootDir>/src/gherkin/$1",
    "^@gherkin$": "<rootDir>/src/gherkin/index.ts",
    "^@scopes/(.*)$": "<rootDir>/src/test-scopes/$1",
    "^@scopes$": "<rootDir>/src/test-scopes/index",
    "^@typing/(.*)$": "<rootDir>/src/type-extensions/app/$1",
    "^@typing$": "<rootDir>/src/type-extensions/index",
    "^@fs/(.*)$": ["<rootDir>/src/filesystem/$1"],
    "^@fs$": ["<rootDir>/src/filesystem"],
    "^@config/(.*)$": ["<rootDir>/src/config/$1"],
    "^@config": ["<rootDir>/src/config"],
  },
};
export default config;
