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

import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { FinalConstants, JwsSignOptions, TJwsSignOptions } from '@/renderer/service/jws-sign-options';

export class GemIdpJwsOptions extends JwsSignOptions {
  constructor(challenge: string, cert: string, cardType: ECardTypes) {
    super(challenge, cert, cardType);
  }

  createJwsOptions(): TJwsSignOptions {
    const header = {
      alg: FinalConstants.RSASSA_PSS_USING_SHA256,
      x5c: [this.cert],
      typ: 'JWT',
      cty: 'NJWT',
    };
    const jwsHeader = this.base2urlEncode(header);
    const payload = { njwt: this.challenge };
    const jwsPayload = this.base2urlEncode(payload);
    return { protectedHeader: jwsHeader, payload: jwsPayload };
  }
}
