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
        details: 'Der Funktionstest wurde vom Benutzer abgebrochen.',
        name: 'Funktionstest abgebrochen',
        status: 'failure',
        title: '',
      },
    ]);
  });
});
