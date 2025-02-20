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

import store from '@/renderer/store';

const got = require('got');

const MOCK_AUTH_REQUEST_PARAMS = {
  challenge_path: 'http://login:8083/test/auth?var1=1&var2=2',
};

const MOCK_AUTH_RESPONSE_PROMPT_DATA = {
  challenge_endpoint: 'http://challenge_path:8083/required/auth?var1=1',
  challenge: 'KuaS9tU7Z676Oz1w0v0vCIpgft21K8eiQKDkwP_HXdE',
  type: 'auth',
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
    store.commit('idpServiceStore/resetStore');
  });

  it('sends auth request and gets authResponsePromptData ', async () => {
    store.commit('idpServiceStore/setChallengePath', MOCK_AUTH_REQUEST_PARAMS.challenge_path);
    expect(store.state.idpServiceStore.challengePath).toEqual(MOCK_AUTH_REQUEST_PARAMS.challenge_path);

    const result = await store.dispatch('idpServiceStore/getChallengeData');
    store.commit('idpServiceStore/setChallengePath', MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge_endpoint);

    expect(result).toEqual(true);
    expect(got.get).toHaveBeenCalledTimes(1);
    expect(store.state.idpServiceStore.challenge).toEqual(MOCK_AUTH_RESPONSE_PROMPT_DATA.challenge);
  });
});

describe('auth service sendSignedChallenge action', () => {
  beforeEach(() => {
    store.commit('idpServiceStore/resetStore');
  });
  it('sends auth request and gets authResponsePromptData ', async () => {
    // prepare store to test
    store.commit('idpServiceStore/setChallengePath', MOCK_AUTH_REQUEST_PARAMS.challenge_path);
    store.commit('idpServiceStore/setOpenIdConfiguration', {
      authorization_endpoint: 'https://xxx',
    });

    store.commit('idpServiceStore/setHbaJwsSignature', 'JWS_HBA');
    store.commit('idpServiceStore/setSmcbJwsSignature', 'JWS_SMCB');

    await store.dispatch('idpServiceStore/getChallengeData');

    const res = await store.dispatch('idpServiceStore/sendAuthorizationRequestAction');

    expect(res).toEqual({
      redirectUri: callbackUrl,
      statusCode: 200,
      idpError: undefined,
    });
  });
});
