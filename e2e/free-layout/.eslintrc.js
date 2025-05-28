const { defineConfig } = require('@flowgram.ai/eslint-config');

module.exports = defineConfig({
  preset: 'web',
  packageRoot: __dirname,
  rules: {
    'no-restricted-syntax': [
      'warn',
      {
        selector: "CallExpression[callee.property.name='waitForTimeout']",
        message: 'Consider using waitForFunction instead of waitForTimeout.',
      },
    ],
  },
});
