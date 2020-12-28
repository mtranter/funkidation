module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: [".eslintrc.js", "*.spec.ts"],
  plugins: [
    '@typescript-eslint',
    'functional'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:functional/external-recommended',
    'plugin:functional/recommended'
  ],
  rules: {
    "functional/functional-parameters": "off"
  }
};
