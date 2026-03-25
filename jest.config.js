/*
 * Copyright 2026, gematik GmbH
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

const testPathIgnorePatterns = [];

if (process.platform !== 'win32') {
  testPathIgnorePatterns.push('<rootDir>/tests/.*\\.windows\\.spec\\.ts$');
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  globals: {},
  transform: {
    '^.+\\.mjs$': 'babel-jest',
    '^.+\\.(ts|tsx|js|jsx|cjs)$': 'ts-jest',
    '^.+\\.vue$': '<rootDir>/tests/vue3TSJestWorkaround.js',
    '^.+\\.(xml|txt|pem)$': '@glen/jest-raw-loader',
  },
  moduleDirectories: ['node_modules', 'src', __dirname],
  moduleNameMapper: {
    '^.+\\.(png|jpg|svg)$': 'jest-transform-stub',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  testPathIgnorePatterns: testPathIgnorePatterns,
  watchPathIgnorePatterns: [
    '<rootDir>/jest.json',
    '<rootDir>/node_modules',
    '<rootDir>/reports',
    '<rootDir>/jenkins-jest-test-report.xml',
    '<rootDir>/junit.xml',
    '<rootDir>/test-report.xml',
    '<rootDir>/dist_electron',
  ],
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx', 'node', 'mjs', 'cjs'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  modulePathIgnorePatterns: ['__snapshots__'],
  setupFiles: ['dotenv/config', './tests/jest-config/setup.ts'],
  coverageReporters: ['cobertura', 'lcov', 'text'],
  transformIgnorePatterns: ['node_modules/(?!(flat|uuid|minimatch|tailwindcss|yaml|perfect-debounce|birpc)/)'],
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
