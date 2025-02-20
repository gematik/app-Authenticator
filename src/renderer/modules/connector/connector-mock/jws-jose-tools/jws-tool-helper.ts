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
 */

// #!if MOCK_MODE === 'ENABLED'
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';

import { ENCRYPTION_TYPES } from '@/renderer/modules/connector/constants';

type TCardParams = (string | number | boolean)[];

/**
 * JwsOptionsMocked for creating JWS Signature
 */
abstract class MockJWSOptions {
  protected _cardType: ECardTypes;
  protected readonly _challenge: string | undefined;
  protected readonly _params: TCardParams;

  protected constructor(cardType: ECardTypes, challenge: string | undefined, ...args: TCardParams) {
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

  abstract getProtectedHeader(isEccCert: boolean): object | string;
}

export { MockJWSOptions };

export class MockCIdpJWSOptions extends MockJWSOptions {
  constructor(cardType: ECardTypes, challenge: string | undefined) {
    super(cardType, challenge);
  }

  getProtectedHeader(isEccCert: boolean): object {
    return {
      x5c: [this.getCert()],
      typ: 'JWT',
      cty: 'NJWT',
      alg: isEccCert ? ENCRYPTION_TYPES.ECC_ALG_SHA256 : ENCRYPTION_TYPES.RSASSA_PSS_USING_SHA256,
    };
  }

  getPayload(): string {
    return JSON.stringify({
      njwt: this._challenge,
    });
  }
}

// #!endif
