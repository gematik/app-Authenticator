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
