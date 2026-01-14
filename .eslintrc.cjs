module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['next/core-web-vitals'],
  rules: {
    // Keep CI strict: no warnings allowed via --max-warnings=0
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
