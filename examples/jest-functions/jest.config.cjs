/** @type {import('jest').Config} */
module.exports = {
  transform: {
    "^.+\\.feature$": "@autometa/jest-transformer",
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["**/*.feature"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "feature"],
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  rootDir: ".",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
