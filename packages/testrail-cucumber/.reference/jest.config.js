const config = {
  moduleDirectories: ["node_modules", "src"],
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
};
export default config;
