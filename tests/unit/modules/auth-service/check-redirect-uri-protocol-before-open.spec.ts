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
