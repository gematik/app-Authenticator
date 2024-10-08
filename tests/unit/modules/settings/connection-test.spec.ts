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

import { runTestsCases, TestStatus } from '@/renderer/modules/settings/services/test-runner';

describe('Test connection test', () => {
  it('test startConnectionTests function', async function () {
    const c1Result = { title: 'c1', status: TestStatus.failure, name: 'Failed', details: 'Thats the right way' };
    const c1 = () => Promise.resolve(c1Result);
    const c2Result = { title: 'c2', status: TestStatus.failure, name: 'Failed', details: 'Thats the right way' };
    const c2 = () => Promise.resolve(c2Result);
    const results = await runTestsCases([c1, c2]);

    expect(results.length).toBe(2);

    expect(results[0]).toBe(c1Result);
    expect(results[1]).toBe(c2Result);
  });
});
