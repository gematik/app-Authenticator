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
