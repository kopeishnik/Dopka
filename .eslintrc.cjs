module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['eslint:recommended', 'plugin:sonarjs/recommended'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  globals: {
    BigInt: true,
  },
  plugins: ['sonarjs'],
  rules: {
    'sonarjs/cognitive-complexity': ['error', 15],
    indent: ['error', 2],
  },
};
