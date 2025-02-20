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
 */

// #!if MOCK_MODE === 'ENABLED'
import { MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
// #!endif
import { getConfig } from '@/renderer/utils/get-configs';
import { connectorReachabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-reachability';
import { connectorSmcbReadabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-smcb-readability';
import { connectorHbaReadabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-hba-readability';
import { idpReachabilityTest } from '@/renderer/modules/settings/services/test-cases/idp-reachability';
import { certsValidityTest } from '@/renderer/modules/settings/services/test-cases/certs-validity-test';
import { logger } from '@/renderer/service/logger';
import { SweetAlertResult } from 'sweetalert2';
import i18n from '@/renderer/i18n';

const allTestCases: TestFunction[] = [
  connectorReachabilityTest,
  connectorSmcbReadabilityTest,
  connectorHbaReadabilityTest,
  certsValidityTest,
  idpReachabilityTest,
];

export enum TestStatus {
  success = 'success',
  failure = 'failure',
  warning = 'warning',
}

export type TestResult = { title: string; name: string; status: TestStatus; details: string };
type TestFunction = () => Promise<TestResult> | Promise<TestResult[]>;

export async function runTestsCases(
  testCases: TestFunction[] = allTestCases,
  cancelPromise?: Promise<SweetAlertResult<Awaited<unknown>>>,
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const translate = i18n.global.t;
  logger.info('Start test cases');

  for (const testCase of testCases) {
    // #!if MOCK_MODE === 'ENABLED'
    const isMockModeActive = getConfig(MOCK_CONNECTOR_CONFIG).value;
    if (
      isMockModeActive &&
      (testCase === connectorReachabilityTest ||
        testCase === connectorSmcbReadabilityTest ||
        testCase === connectorHbaReadabilityTest)
    ) {
      continue;
    }
    // #!endif

    try {
      /**
       * This promise actually only waits for the test and returns the test result,
       * but if the user clicks the cancel button, the promise rejects and stops the whole process
       */
      const restResults: TestResult | TestResult[] = await new Promise((resolve, reject): void => {
        testCase().then((testCaseResult) => {
          resolve(testCaseResult);
        });

        cancelPromise?.then((swalRes) => {
          if (!swalRes.isConfirmed) {
            reject();
          }
        });
      });

      if (Array.isArray(restResults)) {
        results.push(...restResults);
      } else {
        results.push(restResults);
      }
    } catch (e) {
      logger.info('Function test process interrupted');
      results.push({
        title: translate(''),
        name: translate('function_test_cancelled'),
        details: translate('function_test_cancelled_by_user_description'),
        status: TestStatus.failure,
      });
      break;
    }
  }
  logger.info('Finished test cases');
  return results;
}
