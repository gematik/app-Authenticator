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

import store from '@/renderer/store';

const got = require('got');

const MOCK_AUTH_REQUEST_PARAMS = {
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
    location: callbackUrl,
  },
});

describe('auth service sendAuthRequest action', () => {
  beforeEach(() => {
    store.commit('gemIdpServiceStore/resetStore');
  });

  it('sends auth request and gets authResponsePromptData ', async () => {
    store.commit('gemIdpServiceStore/setChallengePath', MOCK_AUTH_REQUEST_PARAMS.challenge_path);
    expect(store.state.gemIdpServiceStore.challengePath).toEqual(MOCK_AUTH_REQUEST_PARAMS.challenge_path);

    const result = await store.dispatch('gemIdpServiceStore/getChallengeData');
    store.commit('gemIdpServiceStore/setChallengePath', MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge_endpoint);

    expect(result).toEqual(true);
    expect(got.get).toHaveBeenCalledTimes(1);
    expect(store.state.gemIdpServiceStore.challenge).toEqual(MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge);
  });
});

describe('auth service sendSignedChallenge action', () => {
  beforeEach(() => {
    store.commit('gemIdpServiceStore/resetStore');
  });
  it('sends auth request and gets authResponsePromptData ', async () => {
    // prepare store to test
    store.commit('gemIdpServiceStore/setChallengePath', MOCK_AUTH_REQUEST_PARAMS.challenge_path);
    store.commit('gemIdpServiceStore/setOpenIdConfiguration', {
      authorization_endpoint: 'https://xxx',
    });

    store.commit('gemIdpServiceStore/setHbaJwsSignature', 'JWS_HBA');
    store.commit('gemIdpServiceStore/setSmcbJwsSignature', 'JWS_SMCB');

    await store.dispatch('gemIdpServiceStore/getChallengeData');

    const res = await store.dispatch('gemIdpServiceStore/getRedirectUriWithToken');

    expect(res).toEqual({
      redirectUri: callbackUrl,
      statusCode: 200,
      idpError: undefined,
    });
  });
});
