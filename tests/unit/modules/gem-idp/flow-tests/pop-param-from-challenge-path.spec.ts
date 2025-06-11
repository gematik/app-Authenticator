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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import store from '@/renderer/store';
import { TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import { getParamFromChallengePath } from '@/renderer/modules/gem-idp/services/arguments-parser';

const TEST_CHALLENGE_PATH =
  'https://xx.de/auth?client_id=GEMAmediTISHJL7rK0tR&response_type=code&nonce=UE54P39wyUKggjPsvItc&callback=DIRECT';

describe('AuthFlow.vue', () => {
  beforeEach(() => {
    store.commit('idpServiceStore/resetStore');
  });

  it('should correctly return the clean challenge path and return correct value', async () => {
    // Set up test data

    const expectedChallengePath =
      'https://xx.de/auth?client_id=GEMAmediTISHJL7rK0tR&response_type=code&nonce=UE54P39wyUKggjPsvItc';

    const param = 'callback';

    // Call the function
    const returnValue = getParamFromChallengePath(param, TEST_CHALLENGE_PATH);

    // Verify results
    expect(returnValue.cleanChallengePath).toBe(expectedChallengePath);
    expect(returnValue.value).toBe(TCallback.DIRECT);
  });

  it('negative: should return null  and return the same challenge path', async () => {
    const param = 'non-existing-param';

    // Call the function
    const returnValue = getParamFromChallengePath(param, TEST_CHALLENGE_PATH);

    // Verify results
    expect(returnValue.cleanChallengePath).toBe(
      'https://xx.de/auth?client_id=GEMAmediTISHJL7rK0tR&response_type=code&nonce=UE54P39wyUKggjPsvItc&callback=DIRECT',
    );
    expect(returnValue.value).toBe(null);
  });
});
