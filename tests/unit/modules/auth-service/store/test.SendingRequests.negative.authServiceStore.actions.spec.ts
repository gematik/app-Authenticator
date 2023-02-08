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

import store from '@/renderer/store';
import got from 'got';
import { KeycloakPluginError } from '@/renderer/errors/errors';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';

const MOCK_AUTH_REQUEST_PARAMS = {
  authz_path: 'http://Authorization:8083/test/auth?var1=1&var2=2',
  challenge_path: 'http://login:8083/test/auth?var1=1&var2=2',
};

const MOCK_AUTH_RESPONSE_PROMPT_DATA = {
  response: { data: { error: 'Missing SMC-B token.' }, headers: { error_uri: 'error_uri' } },
};

// mock sweetalert, it renders only ui therefore it doesn't
// make sense to implement any functionality in this case
jest.mock('sweetalert', () => () => {});

jest.spyOn(got, 'get').mockImplementation(() => {
  throw {
    response: {
      body: MOCK_AUTH_RESPONSE_PROMPT_DATA.response.data,
      headers: { error_uri: MOCK_AUTH_RESPONSE_PROMPT_DATA.response.headers.error_uri },
    },
  };
});

describe('auth service sendAuthRequest action', () => {
  beforeEach(() => {
    store.commit('authServiceStore/resetStore');
  });

  it('[Negative] sends auth request and gets challenge Data ', async () => {
    store.commit('authServiceStore/setAuthRequestPath', MOCK_AUTH_REQUEST_PARAMS as TOidcProtocol2UrlSpec);
    expect(store.state.authServiceStore.authRequestPath).toEqual(MOCK_AUTH_REQUEST_PARAMS.authz_path);

    await expect(store.dispatch('authServiceStore/getChallengeData')).rejects.toThrow(
      new KeycloakPluginError('Could not get challenge data for authentication', {
        error: MOCK_AUTH_RESPONSE_PROMPT_DATA.response.data.error,
        url: MOCK_AUTH_RESPONSE_PROMPT_DATA.response.headers['error_uri'],
      }),
    );
  });
});
