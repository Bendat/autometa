// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

export default {
  clearMocks: true,
  testEnvironment: "node",
  moduleFileExtensions: ["feature", "js", "json", "ts", "tsx"],

  testMatch: [
    "<rootDir>/test/**/*.feature",
    "**/?(*.)+(spec|test|feature).[tj]s?(x)",
  ],

  transform: {
    "^.+\\.ts$": "ts-jest",
    // "^.+\\.feature$": "@autometa/cucumber-transformer-jest"
  },

  setupFiles: [],
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ["/node_modules/", "/src/.tools/"],
  // reporters are configured in here - save the test report to the `component-test-report/index.html` file
  // no need to copy and rename files now as all the test files are in the same folder with nothing else
  reporters: ["default"],
};
