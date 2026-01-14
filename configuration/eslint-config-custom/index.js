const extendsConfig = ["prettier"];

try {

  require("eslint-plugin-turbo");
  extendsConfig.push("plugin:turbo/recommended");
} catch (error) {
  if (process.env.CI) {
    // Fail loudly in CI so we do not silently skip important lint rules.
    throw error;
  }

  // eslint-config-turbo was not available; fall back to a configuration
  // without the plugin so developers can run lint locally.
  // eslint-disable-next-line no-console
  console.warn(
    "[eslint-config-custom] Skipping eslint-plugin-turbo – falling back to core rules only.",
    error.message
  );
}

module.exports = {
  extends: [
    ...extendsConfig,
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: ["*.js", "dist/*"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error"
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
};
