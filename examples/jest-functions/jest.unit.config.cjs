/** @type {import('jest').Config} */
module.exports = {
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  rootDir: ".",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
