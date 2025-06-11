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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

// #!if MOCK_MODE === 'ENABLED'
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { logger } from '@/renderer/service/logger';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';
import { createEccJWS } from '@/renderer/modules/connector/connector-mock/jws-jose-tools/sign-bp-256';

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

  /**
   * Check if the private key is an ECC key
   * @param privateKeyPem
   */
  isEccCert(privateKeyPem: string): boolean {
    // RSA keys do not contain the string 'EC PRIVATE
    return privateKeyPem.includes('-----BEGIN EC PRIVATE KEY-----');
  }

  /**
   * Create a JWS signature
   * @param isEccCert
   * @param payload
   * @param header
   */
  async createJws(isEccCert: boolean, payload: string, header: object) {
    logger.info('Create mocked JWS!');
    const privateKeyPem = this.getPrivateKey();

    if (isEccCert) {
      return createEccJWS(JSON.stringify(header), payload, privateKeyPem);
    } else {
      const jwkKey = await JWK.asKey(privateKeyPem, 'pem');
      const jwsSignature = JWS.createSign(
        {
          format: 'compact',
          fields: header,
        },
        jwkKey,
      ).update(payload, 'utf8');
      logger.info('JoseJWS created!');
      return jwsSignature.final();
    }
  }
}

// #!endif
