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

/**
 * @jest-environment jsdom
 */

import { validateRedirectUriProtocol } from '@/renderer/utils/validate-redirect-uri-protocol';

const INVALID_PROTOCOLS = {
  FILE: 'file:///any-file-on-the-system',
  FILE_WIN_PATH: 'C:\\Windows\\System32\\cmd.exe',
  CUSTOM_PROTOCOL: 'custom://any-string',
  NO_PROTOCOL: 'any-string',
};

const VALID_PROTOCOLS = {
  HTTP: 'http://gematik.de',
  HTTPS: 'https://gematik.de',
};

describe('check redirect uri protocol verifier', () => {
  it('redirect uri protocol verifier crashes on invalid protocols', () => {
    for (const key in INVALID_PROTOCOLS) {
      const invalidProtocolUrl = INVALID_PROTOCOLS[key as keyof typeof INVALID_PROTOCOLS];
      expect(validateRedirectUriProtocol(invalidProtocolUrl)).toBe(false);
    }
  });

  it('redirect uri protocol verifier confirms http and https protocols', () => {
    for (const key in VALID_PROTOCOLS) {
      const invalidProtocolUrl = VALID_PROTOCOLS[key as keyof typeof VALID_PROTOCOLS];
      expect(validateRedirectUriProtocol(invalidProtocolUrl)).toBe(true);
    }
  });
});
