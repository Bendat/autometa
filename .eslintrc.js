module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: ["custom"],
  ignorePatterns: [
    "**/*/*.yaml",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.docusaurus/**",
    "node_modules/",
  ],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
};
