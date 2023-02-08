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
