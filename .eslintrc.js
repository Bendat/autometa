module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: ["custom"],
  ignorePatterns: ["**/*/*.yaml", "node_modules/"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
};
