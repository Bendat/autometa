module.exports = {
  root: true,
  extends: ["custom"],
  overrides: [
    {
      files: ["src/__tests__/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
