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

import { SweetAlertResult } from 'sweetalert2';
import { runTestsCases, TestStatus } from '@/renderer/modules/settings/services/test-runner';

// sleep function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('runTestsCases cancellation', () => {
  it('should cancel the test cases after 1 succeed', async () => {
    const fakeTestFunction = async () => {
      await sleep(1000);
      return {
        title: '',
        name: 'fakeTest',
        status: TestStatus.success,
        details: 'Fake test passed',
      };
    };

    const testCases = [fakeTestFunction, fakeTestFunction];
    const cancelPromise = new Promise<SweetAlertResult<unknown>>((resolve) => {
      setTimeout(() => {
        resolve({ isConfirmed: false, isDenied: false, isDismissed: true, value: undefined });
      }, 1500);
    });

    const results = await runTestsCases(testCases, cancelPromise);
    expect(results).toHaveLength(2);
    expect(results).toEqual([
      { details: 'Fake test passed', name: 'fakeTest', status: 'success', title: '' },
      {
        details: 'Der Funktionstest wurde vom Benutzer abgebrochen',
        name: 'Funktionstest abgebrochen',
        status: 'failure',
        title: '',
      },
    ]);
  });
});
