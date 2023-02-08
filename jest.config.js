/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  globals: {
    window: {},
  },
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.(xml|txt|pem)$': 'jest-raw-loader',
  },
  moduleDirectories: ['node_modules', 'src', '.'],
  moduleNameMapper: {
    '^.+\\.(png|jpg|svg)$': 'jest-transform-stub',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  modulePathIgnorePatterns: ['__snapshots__'],
  setupFiles: ['dotenv/config', './tests/jest-config/setup.ts'],
  testSequencer: './tests/jest-config/test-sequencer.js',
  coverageReporters: ['cobertura', 'lcov', 'text'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testResultsProcessor: './resultsProcessor.js',
  reporters: [
    'default',
    [
      './node_modules/jest-junit',
      {
        outputName: 'jenkins-jest-test-report.xml',
      },
    ],
    [
      './node_modules/jest-html-reporter',
      {
        pageTitle: 'Test---Report',
        outputPath: 'reports/jest-test-report.html',
        includeConsoleLog: true,
        logo: 'src/assets/logo_gematik.svg',
        expand: true,
        openReport: true,
      },
    ],
  ],
};
