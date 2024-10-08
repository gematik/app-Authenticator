/*
 * Copyright 2024 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  globals: {},
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
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
  watchPathIgnorePatterns: [
    '<rootDir>/jest.json',
    '<rootDir>/node_modules',
    '<rootDir>/reports',
    '<rootDir>/jenkins-jest-test-report.xml',
    '<rootDir>/junit.xml',
    '<rootDir>/test-report.xml',
    '<rootDir>/dist_electron',
  ],
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  modulePathIgnorePatterns: ['__snapshots__'],
  setupFiles: ['dotenv/config', './tests/jest-config/setup.ts'],
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
