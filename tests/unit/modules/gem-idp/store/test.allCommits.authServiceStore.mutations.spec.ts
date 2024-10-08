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

import { INITIAL_AUTH_STORE_STATE } from '@/renderer/modules/gem-idp/store/gem-idp-service-store';
import store from '@/renderer/store';

describe('auth service store', () => {
  it('initializes', async () => {
    expect(store.state.gemIdpServiceStore).toEqual(INITIAL_AUTH_STORE_STATE);
  });

  it('sets hbaJwsSignature and resets', async () => {
    const HBA_SIGNATURE_MOCK = 'awesomeHbaSignature';

    store.commit('gemIdpServiceStore/setHbaJwsSignature', HBA_SIGNATURE_MOCK);
    expect(store.state.gemIdpServiceStore.jwsHbaSignature).toBe(HBA_SIGNATURE_MOCK);

    store.commit('gemIdpServiceStore/resetStore');
    expect(store.state.gemIdpServiceStore.jwsHbaSignature).toBe(undefined);
  });

  it('sets smcbJwsSignature and resets', async () => {
    const SMCB_SIGNATURE_MOCK = 'awesomeSMCBSignature';

    store.commit('gemIdpServiceStore/setSmcbJwsSignature', SMCB_SIGNATURE_MOCK);
    expect(store.state.gemIdpServiceStore.jwsSmcbSignature).toBe(SMCB_SIGNATURE_MOCK);

    store.commit('gemIdpServiceStore/resetStore');
    expect(store.state.gemIdpServiceStore.jwsSmcbSignature).toBe(undefined);
  });

  it('sets sid and resets', async () => {
    const SID_MOCK = 'awesomeSid';

    store.commit('gemIdpServiceStore/setSid', SID_MOCK);
    expect(store.state.gemIdpServiceStore.sid).toBe(SID_MOCK);

    store.commit('gemIdpServiceStore/resetStore');
    expect(store.state.gemIdpServiceStore.sid).toBe(undefined);
  });

  it('set setAuthRequestPath and resets', async () => {
    const MOCK = {
      challenge_path: 'code_challenge',
      server_mode: false,
    };

    store.commit('gemIdpServiceStore/setChallengePath', MOCK.challenge_path);
    expect(store.state.gemIdpServiceStore.challengePath).toEqual(MOCK.challenge_path);

    store.commit('gemIdpServiceStore/resetStore');
    expect(store.state.gemIdpServiceStore.challengePath).toBe('');
  });
});
