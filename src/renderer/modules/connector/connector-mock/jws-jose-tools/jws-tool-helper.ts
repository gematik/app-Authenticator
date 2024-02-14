/*
 * Copyright 2023 gematik GmbH
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
import { FinalConstants } from '@/renderer/service/jws-sign-options';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';

/**
 * JwsOptionsMocked for creating JWS Signature
 */
abstract class MockJWSOptions {
  protected _cardType: ECardTypes;
  protected readonly _challenge: string | undefined;
  protected readonly _params: any;

  protected constructor(cardType: ECardTypes, challenge: string | undefined, ...args: any) {
    this._cardType = cardType;
    this._challenge = challenge;
    this._params = args;
  }

  protected getCert(): string {
    return this._cardType === ECardTypes.HBA
      ? readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT, true)
      : readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.SMCB_CERT, true);
  }

  get cardType(): ECardTypes {
    return this._cardType;
  }

  set cardType(value: ECardTypes) {
    this._cardType = value;
  }

  abstract getPayload(): string;

  abstract getProtectedHeader(): object | string;
}

export { MockJWSOptions };

export class MockCIdpJWSOptions extends MockJWSOptions {
  constructor(cardType: ECardTypes, challenge: string | undefined) {
    super(cardType, challenge);
  }

  getProtectedHeader(): object {
    return {
      format: 'compact',
      fields: {
        x5c: [this.getCert()],
        typ: 'JWT',
        cty: 'NJWT',
        alg: FinalConstants.RSASSA_PSS_USING_SHA256,
      },
    };
  }

  getPayload(): string {
    return JSON.stringify({
      njwt: this._challenge,
    });
  }
}

// #!endif
