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

/* @if MOCK_MODE == 'ENABLED' */
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { logger } from '@/renderer/service/logger';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';

const JWS = require('node-jose/lib/jws');
const JWK = require('node-jose/lib/jwk');

export class MockJwsSignature {
  private readonly _cardType: ECardTypes;

  constructor(cardType: ECardTypes) {
    this._cardType = cardType;
  }
  getPrivateKey() {
    return this._cardType === ECardTypes.HBA
      ? readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY)
      : readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.SMCB_KEY);
  }

  async createJws(payload: string, header: object) {
    logger.info('create JoseJWS!');
    const jwkKey = await JWK.asKey(this.getPrivateKey(), 'pem');
    const jwsSignature = JWS.createSign(header, jwkKey).update(payload, 'utf8');
    logger.info('JoseJWS Created!');
    return jwsSignature.final();
  }
}

/* @endif */
