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
    store.commit('gemIdpServiceStore/resetStore');
  });

  it('[Negative] sends auth request and gets challenge Data ', async () => {
    store.commit('gemIdpServiceStore/setChallengePath', MOCK_AUTH_REQUEST_PARAMS.challenge_path);

    await expect(store.dispatch('gemIdpServiceStore/getChallengeData')).rejects.toThrow(
      new CentralIdpError('Could not get challenge data for authentication'),
    );
  });
});
