module.exports = {
  plugins: [
    [
      "babel-plugin-transform-rewrite-imports",
      {
        appendExtension: ".js",
      },
    ],
  ],
};
