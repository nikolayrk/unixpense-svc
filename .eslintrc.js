module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    overrides: [
      {
        files: ["*.ts"],
        extends: ["plugin:@typescript-eslint/recommended"],
        env: {
          node: true,
        },
        rules: {
          "@typescript-eslint/no-empty-function": "off"
        }
      }
    ]
  };