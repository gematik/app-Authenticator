/*
 * Copyright 2025, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import globals from 'globals';
import eslintJs from '@eslint/js';
import tsEslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import pluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    //---- GLOBAL IGNORES
    // note folders can only be ignored at the global level, per-cfg you must do: '**/dist/**/*'
    ignores: ['**/dist/', '**/vendor/'],
  },
  // general defaults
  eslintJs.configs['recommended'],
  // general
  {
    files: ['**/*.{js,ts,jsx,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
      },
    },

    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
      // eslint-disable-next-line no-undef
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'error',
      // eslint-disable-next-line no-undef
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'error',
      'no-var': 'error',
      semi: 'error',
      'no-multi-spaces': 'error',
      'space-in-parens': 'error',
      'no-multiple-empty-lines': 'error',
      'prefer-const': 'error',
      'no-control-regex': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
  // chosen typescript defaults: too strict for now
  // ...tsEslint.configs['recommended'],
  // typescript
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: tsEslint.parser,
    },
  },

  // chosen vue defaults
  ...pluginVue.configs['flat/essential'],
  // vue
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsEslint.parser, // parse TS inside VUE
      },
    },
    rules: {
      'vue/no-mutating-props': 'off',
      'vue/no-unused-vars': 'error',
    },
  },
  eslintPluginPrettierRecommended,
];
