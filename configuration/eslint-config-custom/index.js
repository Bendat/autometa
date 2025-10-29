const extendsConfig = ["prettier"];

try {
  require("eslint-config-turbo");
  extendsConfig.push("turbo");
} catch (error) {
  if (process.env.CI) {
    // Fail loudly in CI so we do not silently skip important lint rules.
    throw error;
  }

  // eslint-config-turbo currently crashes when the project uses the new
  // "tasks" schema. Until the upstream package is updated we fall back to a
  // configuration without the plugin so developers can run lint locally.
  // See https://github.com/vercel/turbo/issues/XXXXX (placeholder).
  // eslint-disable-next-line no-console
  console.warn(
    "[eslint-config-custom] Skipping eslint-config-turbo – falling back to core rules only.",
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
