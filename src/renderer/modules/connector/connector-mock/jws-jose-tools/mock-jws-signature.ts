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

// #!endif
