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

import store from '@/renderer/store';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';

const got = require('got');

const MOCK_AUTH_REQUEST_PARAMS = {
  authz_path: 'http://Authorization:8083/test/auth?var1=1&var2=2',
  challenge_path: 'http://login:8083/test/auth?var1=1&var2=2',
};

const MOCK_AUTH_RESPONSE_PROMPT_DATA = {
  challenge_endpoint: 'http://challenge_path:8083/required/auth?var1=1',
  challenge: 'KuaS9tU7Z676Oz1w0v0vCIpgft21K8eiQKDkwP_HXdE',
  type: 'auth',
  sid: 'test_userid',
};

// mock sweetalert, it renders only ui therefore it doesn't
// make sense to implement any functionality in this case
const callbackUrl = 'http://test:0001/callback?session_state=1111111&code=testscode';

jest.spyOn(got, 'get').mockReturnValue({
  json: () => MOCK_AUTH_RESPONSE_PROMPT_DATA,
});
jest.spyOn(got, 'post').mockReturnValue({
  json: () => {},
  statusCode: 200,
  headers: {
    'x-callback-location': callbackUrl,
  },
});

describe('auth service sendAuthRequest action', () => {
  beforeEach(() => {
    store.commit('authServiceStore/resetStore');
  });

  it('sends auth request and gets authResponsePromptData ', async () => {
    store.commit('authServiceStore/setAuthRequestPath', MOCK_AUTH_REQUEST_PARAMS as TOidcProtocol2UrlSpec);
    expect(store.state.authServiceStore.authRequestPath).toEqual(MOCK_AUTH_REQUEST_PARAMS.authz_path);
    const result = await store.dispatch('authServiceStore/getChallengeData');
    store.commit('authServiceStore/setChallengePath', MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge_endpoint);

    expect(result).toEqual(true);
    expect(got.get).toHaveBeenCalledTimes(1);
    expect(store.state.authServiceStore.sid).toEqual(MOCK_AUTH_RESPONSE_PROMPT_DATA.sid);
    expect(store.state.authServiceStore.challenge).toEqual(MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge);
    expect(store.state.authServiceStore.challengePath).toEqual(MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge_endpoint);
  });
});

describe('auth service sendSignedChallenge action', () => {
  beforeEach(() => {
    store.commit('authServiceStore/resetStore');
  });
  it('sends auth request and gets authResponsePromptData ', async () => {
    // prepare store to test
    store.commit('authServiceStore/setAuthRequestPath', MOCK_AUTH_REQUEST_PARAMS);
    store.commit('authServiceStore/setHbaJwsSignature', 'JWS_HBA');
    store.commit('authServiceStore/setSmcbJwsSignature', 'JWS_SMCB');

    await store.dispatch('authServiceStore/getChallengeData');

    const res = await store.dispatch('authServiceStore/getRedirectUriWithToken');

    expect(res).toEqual({ redirectUri: callbackUrl, statusCode: 200, error_uri: undefined });
  });
});
