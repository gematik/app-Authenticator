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

const OGR_ARGV = [
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
  'authenticator:/?authz_path=https%253A%252F%252Fidp%253A8443%252Fauth%252Frealms%252FTestrealm%252Fprotocol%252Fopenid-connect%252Fauth%253Fclient_id%253Doidc_rp_ogranwendung%2526client_secret%253Df5dff7e3-daa9-4839-b9c0-61c0669e366f%2526response_type%253Dcode%2526scope%253Dopenid%2526login%253Dtrue%2526redirect_uri%253Dhttp%253A%252F%252Flocalhost%253A8090%252Fcallback%2526code_challenge%253DAHXOzBAtfJofxkW5IHS1Fmy930tIu1MLxHjoz9GN_94%2526code_challenge_method%253DS256%2526user_sid%253D7XIQ0kAsSsM%25253D',
];

describe('check deeplink', () => {
  it('parse deeplink properly for gematik idp', () => {
    const deeplink = handleDeepLink(GEM_IDP_ARGV, null);
    expect(parseLauncherArguments(deeplink!)).toEqual({
      authz_path: '',
      challenge_path:
        'http://gstopdh2.top.local:8571/sign_response?client_id=AuthenticatorDevLocal&response_type=code&redirect_uri=http://localhost:8090/callback&state=f1bQrZ4SEsiKCRV4VNqG&code_challenge=AHXOzBAtfJofxkW5IHS1Fmy930tIu1MLxHjoz9GN_94&code_challenge_method=S256&scope=openid authenticator-dev&nonce=MbwsuHIExDKyqKDKSsPp',
    });
  });

  it('parse deeplink properly for OGR idp', () => {
    const deeplink = handleDeepLink(OGR_ARGV, null);
    expect(parseLauncherArguments(deeplink!)).toEqual({
      authz_path:
        'https://idp:8443/auth/realms/Testrealm/protocol/openid-connect/auth?client_id=oidc_rp_ogranwendung&client_secret=f5dff7e3-daa9-4839-b9c0-61c0669e366f&response_type=code&scope=openid&login=true&redirect_uri=http://localhost:8090/callback&code_challenge=AHXOzBAtfJofxkW5IHS1Fmy930tIu1MLxHjoz9GN_94&code_challenge_method=S256&user_sid=7XIQ0kAsSsM=',
      challenge_path: '',
    });
  });
});
