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

import { IIdpEncJwk } from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';

const createJwe = async (signature: string, encJson: IIdpEncJwk, expired: number) => {
  const JWK = require('node-jose/lib/jwk');
  const JWE = require('node-jose/lib/jwe');
  const { fromBase64 } = require('base64url');

  let inputPlain = signature;
  if (signature.startsWith('ey')) {
    inputPlain = fromBase64(
      JSON.stringify({
        njwt: signature,
      }),
    );
  }
  const key = {
    kid: encJson.kid,
    kty: encJson.kty,
    crv: encJson.crv,
    x: encJson.x,
    y: encJson.y,
  };

  JWK.asKey(key);

  const opts = {
    fields: {
      exp: expired,
      epk: {
        crv: key.crv,
      },
      cty: 'NJWT',
    },
  };

  const jwe = JWE.createEncrypt(opts, key);
  jwe.update(Buffer.from(inputPlain));
  const finalJwe = await jwe.final();
  return finalJwe.protected + '..' + finalJwe.iv + '.' + finalJwe.ciphertext + '.' + finalJwe.tag;
};

export default createJwe;
