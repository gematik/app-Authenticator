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

import { INITIAL_AUTH_STORE_STATE } from '@/renderer/modules/auth-service/store/auth-service-store';
import store from '@/renderer/store';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';

describe('auth service store', () => {
  it('initializes', async () => {
    expect(store.state.authServiceStore).toEqual(INITIAL_AUTH_STORE_STATE);
  });

  it('sets hbaJwsSignature and resets', async () => {
    const HBA_SIGNATURE_MOCK = 'awesomeHbaSignature';

    store.commit('authServiceStore/setHbaJwsSignature', HBA_SIGNATURE_MOCK);
    expect(store.state.authServiceStore.jwsHbaSignature).toBe(HBA_SIGNATURE_MOCK);

    store.commit('authServiceStore/resetStore');
    expect(store.state.authServiceStore.jwsHbaSignature).toBe(undefined);
  });

  it('sets smcbJwsSignature and resets', async () => {
    const SMCB_SIGNATURE_MOCK = 'awesomeSMCBSignature';

    store.commit('authServiceStore/setSmcbJwsSignature', SMCB_SIGNATURE_MOCK);
    expect(store.state.authServiceStore.jwsSmcbSignature).toBe(SMCB_SIGNATURE_MOCK);

    store.commit('authServiceStore/resetStore');
    expect(store.state.authServiceStore.jwsSmcbSignature).toBe(undefined);
  });

  it('sets sid and resets', async () => {
    const SID_MOCK = 'awesomeSid';

    store.commit('authServiceStore/setSid', SID_MOCK);
    expect(store.state.authServiceStore.sid).toBe(SID_MOCK);

    store.commit('authServiceStore/resetStore');
    expect(store.state.authServiceStore.sid).toBe(undefined);
  });

  it('set setAuthRequestPath and resets', async () => {
    const MOCK = {
      authz_path: 'authz_path',
      challenge_path: 'code_challenge',
      server_mode: false,
    };

    store.commit('authServiceStore/setAuthRequestPath', MOCK as TOidcProtocol2UrlSpec);
    expect(store.state.authServiceStore.authRequestPath).toEqual(MOCK.authz_path);

    store.commit('authServiceStore/resetStore');
    expect(store.state.authServiceStore.authRequestPath).toBeUndefined();
  });
});
