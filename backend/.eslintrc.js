module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'no-console': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'consistent-return': 'off',
    'func-names': 'off',
    'object-shorthand': 'off',
    'no-process-exit': 'off',
    'no-param-reassign': 'off',
    'no-return-await': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'req|res|next|val' }],
    'max-len': ['error', { code: 120 }],
    'comma-dangle': ['error', 'never']
  }
};