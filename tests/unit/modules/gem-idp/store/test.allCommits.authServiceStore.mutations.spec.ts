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

import { INITIAL_AUTH_STORE_STATE } from '@/renderer/modules/gem-idp/store/idp-service-store';
import store from '@/renderer/store';

describe('auth service store', () => {
  it('initializes', async () => {
    expect(store.state.idpServiceStore).toEqual(INITIAL_AUTH_STORE_STATE);
  });

  it('sets hbaJwsSignature and resets', async () => {
    const HBA_SIGNATURE_MOCK = 'awesomeHbaSignature';

    store.commit('idpServiceStore/setHbaJwsSignature', HBA_SIGNATURE_MOCK);
    expect(store.state.idpServiceStore.jwsHbaSignature).toBe(HBA_SIGNATURE_MOCK);

    store.commit('idpServiceStore/resetStore');
    expect(store.state.idpServiceStore.jwsHbaSignature).toBe(undefined);
  });

  it('sets smcbJwsSignature and resets', async () => {
    const SMCB_SIGNATURE_MOCK = 'awesomeSMCBSignature';

    store.commit('idpServiceStore/setSmcbJwsSignature', SMCB_SIGNATURE_MOCK);
    expect(store.state.idpServiceStore.jwsSmcbSignature).toBe(SMCB_SIGNATURE_MOCK);

    store.commit('idpServiceStore/resetStore');
    expect(store.state.idpServiceStore.jwsSmcbSignature).toBe(undefined);
  });

  it('set setAuthRequestPath and resets', async () => {
    const MOCK = {
      challenge_path: 'code_challenge',
      server_mode: false,
    };

    store.commit('idpServiceStore/setChallengePath', MOCK.challenge_path);
    expect(store.state.idpServiceStore.challengePath).toEqual(MOCK.challenge_path);

    store.commit('idpServiceStore/resetStore');
    expect(store.state.idpServiceStore.challengePath).toBe('');
  });
});
