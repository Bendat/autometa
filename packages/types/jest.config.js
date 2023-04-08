// import type { Config } from "@jest/types";
// Sync object
const config = {
  moduleDirectories: ["node_modules", "src"],
  setupFilesAfterEnv: [],
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"]
  // testRegex: ".*\\.feature\\.test\\.spec.ts$",
  // moduleNameMapper: {},
};
// export default config;
export default config;
// "autometa.config.ts"
