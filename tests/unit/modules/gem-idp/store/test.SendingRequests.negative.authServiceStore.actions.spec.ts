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
import got from 'got';
import { CentralIdpError } from '@/renderer/errors/errors';

const MOCK_AUTH_REQUEST_PARAMS = {
  challenge_path: 'http://login:8083/test/auth?var1=1&var2=2',
};

const MOCK_AUTH_RESPONSE_PROMPT_DATA = {
  response: {
    data: '"{"error":"invalid_request","gematik_error_text":"client_id ist ungültig","gematik_timestamp":1678188405,"gematik_uuid":"eded25c9-86c0-45f0-bdfe-b861edd42e8f","gematik_code":"2012"}"',
    headers: { error_uri: 'error_uri' },
  },
};

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
    store.commit('idpServiceStore/resetStore');
  });

  it('[Negative] sends auth request and gets challenge Data ', async () => {
    store.commit('idpServiceStore/setChallengePath', MOCK_AUTH_REQUEST_PARAMS.challenge_path);

    await expect(store.dispatch('idpServiceStore/getChallengeData')).rejects.toThrow(
      new CentralIdpError('Could not get challenge data for authentication'),
    );
  });
});
