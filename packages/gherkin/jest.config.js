// import type { Config } from "@jest/types";
// Sync object
const config = {
  moduleDirectories: ["node_modules", "src"],
  setupFilesAfterEnv: ["reflect-metadata"],
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/?(*.)+(spec|test|.feature).[jt]s?(x)"],
  // testRegex: ".*\\.feature\\.test\\.spec.ts$",
  // moduleNameMapper: {},
};
// export default config;
export default config;
// "autometa.config.ts"
