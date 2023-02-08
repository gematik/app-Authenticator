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

import { runTestsCases, TestStatus } from '@/renderer/modules/settings/services/test-runner';

describe('Test connection test', () => {
  it('test startConnectionTests function', async function () {
    const c1Result = { status: TestStatus.failure, name: 'Failed', details: 'Thats the right way' };
    const c1 = () => Promise.resolve(c1Result);
    const c2Result = { status: TestStatus.failure, name: 'Failed', details: 'Thats the right way' };
    const c2 = () => Promise.resolve(c2Result);
    const results = await runTestsCases([c1, c2]);

    expect(results.length).toBe(2);

    expect(results[0]).toBe(c1Result);
    expect(results[1]).toBe(c2Result);
  });
});
