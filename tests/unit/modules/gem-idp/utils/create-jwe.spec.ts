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

import base64url from 'base64url';
import createJwe from '@/renderer/modules/gem-idp/sign-feature/create-jwe';
import { IIdpEncJwk } from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';

const encJwk: IIdpEncJwk = {
  use: 'use',
  kid: 'puk_idp_enc',
  kty: 'EC',
  crv: 'BP-256',
  x: 'pkU8LlTZsoGTloO7yjIkV626aGtwpelJ2Wrx7fZtOTo',
  y: 'VliGWQLNtyGuQFs9nXbWdE9O9PFtxb42miy4yaCkCi8',
};

describe('jwe sign-feature', () => {
  it('check header', async () => {
    const jwe = await createJwe('signatur', encJwk, 12345);
    const jsonHeader = JSON.parse(base64url.decode(jwe.substring(0, jwe.indexOf('.')), 'utf8'));
    expect(jsonHeader.exp).toEqual(12345);
    expect(jsonHeader.cty).toEqual('NJWT');
    expect(jsonHeader.enc).toEqual('A256GCM');
    expect(jsonHeader.alg).toEqual('ECDH-ES');
    expect(jsonHeader.kid).toEqual('puk_idp_enc');
    expect(jsonHeader.epk.kty).toEqual('EC');
    expect(jsonHeader.epk.crv).toEqual('BP-256');
  });
});
