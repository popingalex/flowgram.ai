module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  rules: {
    "no-console": "off",
    "no-unused-vars": "off",
    "no-undef": "off",
  },
  ignorePatterns: [
    "*.d.ts",
    "auto-imports.d.ts",
    "components.d.ts",
    "dist/**",
    "node_modules/**",
  ],
};
