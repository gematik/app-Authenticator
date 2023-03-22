/*
 * Copyright 2023 gematik GmbH
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

import { connectorReachabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-reachability';
import { connectorSmcbReadabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-smcb-readability';
import { idpReachabilityTest } from '@/renderer/modules/settings/services/test-cases/idp-reachability';
import { logger } from '@/renderer/service/logger';

/* @if MOCK_MODE == 'ENABLED' */
import { getConfig } from '@/renderer/utils/get-configs';
import { MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
/* @endif */
import { certsValidityTest } from '@/renderer/modules/settings/services/test-cases/certs-validity-test';

const allTestCases: TestFunction[] = [
  connectorReachabilityTest,
  connectorSmcbReadabilityTest,
  idpReachabilityTest,
  certsValidityTest,
];

export enum TestStatus {
  success = 'success',
  failure = 'failure',
}

export type TestResult = { name: string; status: TestStatus; details: string };
type TestFunction = () => Promise<TestResult> | Promise<TestResult[]>;

export async function runTestsCases(testCases: TestFunction[] = allTestCases): Promise<TestResult[]> {
  const results: TestResult[] = [];
  logger.info('start test cases');
  for (const testCase of testCases) {
    /* @if MOCK_MODE == 'ENABLED' */
    const isMockModeActive = getConfig(MOCK_CONNECTOR_CONFIG).value;
    if (isMockModeActive && (testCase === connectorReachabilityTest || testCase === connectorSmcbReadabilityTest)) {
      continue;
    }
    /* @endif */

    const restResults = await testCase();

    if (Array.isArray(restResults)) {
      results.push(...restResults);
    } else {
      results.push(restResults);
    }
  }
  logger.info('finished test cases');
  return results;
}
