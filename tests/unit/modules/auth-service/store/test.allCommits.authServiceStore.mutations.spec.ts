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
