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

import { handleDeepLink, parseLauncherArguments } from '@/main/services/url-service';

const GEM_IDP_ARGV = [
  'C:\\Users\\xxxx\\Desktop\\repos\\authenticator\\node_modules\\electron\\dist\\electron.exe',
  '--allow-file-access-from-files',
  '--secure-schemes=app',
  '--bypasscsp-schemes',
  '--cors-schemes',
  '--fetch-schemes',
  '--service-worker-schemes',
  '--standard-schemes=app',
  '--streaming-schemes',
  'C:\\Users\\xxxx\\Desktop\\repos\\authenticator',
  'authenticator:/?challenge_path=http%3A%2F%2Fgstopdh2.top.local%3A8571%2Fsign_response%3Fclient_id%3DAuthenticatorDevLocal&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8090%2Fcallback&state=f1bQrZ4SEsiKCRV4VNqG&code_challenge=AHXOzBAtfJofxkW5IHS1Fmy930tIu1MLxHjoz9GN_94&code_challenge_method=S256&scope=openid%20authenticator-dev&nonce=MbwsuHIExDKyqKDKSsPp',
];

describe('check deeplink', () => {
  it('parse deeplink properly for gematik idp', () => {
    const deeplink = handleDeepLink(GEM_IDP_ARGV, null);
    expect(parseLauncherArguments(deeplink!)).toEqual({
      challenge_path:
        'http://gstopdh2.top.local:8571/sign_response?client_id=AuthenticatorDevLocal&response_type=code&redirect_uri=http://localhost:8090/callback&state=f1bQrZ4SEsiKCRV4VNqG&code_challenge=AHXOzBAtfJofxkW5IHS1Fmy930tIu1MLxHjoz9GN_94&code_challenge_method=S256&scope=openid authenticator-dev&nonce=MbwsuHIExDKyqKDKSsPp',
    });
  });
});
