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

import { TAuthSignParameter, TContextParameter, TEntryOptions, TGetCardsParameter } from '../type-definitions';
import { getConfig, getConfigGroup } from '@/renderer/utils/get-configs';
import {
  AUTH_SIGN_PARAMETER_CONFIG_GROUP,
  CONTEXT_PARAMETERS_CONFIG_GROUP,
  ENTRY_OPTIONS_CONFIG_GROUP,
  TLS_AUTH_TYPE_CONFIG,
} from '@/config';
import { CARD_PIN_TYPES, CRYPT_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

class ConnectorConfig {
  public tlsEntryOptions: TEntryOptions = {
    hostname: '127.0.0.1',
    port: 443,
    secureProtocol: 'TLSv1_2_method',
    keyFile: 'not-defined',
    certFile: 'not-defined',
    pfxFile: 'not-defined',
    pfxPassword: 'not-defined',
    username: 'not-defined',
    password: 'not-defined',
    rejectUnauthorized: false,
    remoteKT: 'not-defined',
    localKT: 'not-defined',
  };

  private hbaCardParameters = {
    cardType: ECardTypes.HBA,
    pinType: CARD_PIN_TYPES.HBA_PIN_CH,
  };

  private smcbCardParameters = {
    cardType: ECardTypes.SMCB,
    pinType: CARD_PIN_TYPES.SMCB_PIN_SM,
  };

  public authSignParameter: TAuthSignParameter = {
    signatureType: SIGNATURE_TYPES.ECC,
    // @deprecated
    signatureCidpSchemes: 'RSASSA-PSS', // deprecated as it throws an error for ECC and not required at all
    base64data: 'YK+JQHBucqT8OaqOyNHkYR4kAYtUQawphBNwfEaOA7Y=',
  };

  public contextParameters = {
    mandantId: 'mandant1',
    clientId: 'client1',
    workplaceId: 'workplace1',
    userId: '',
  };

  public certReaderParameter = {
    certificateRef: 'C.AUT',
    crypt: CRYPT_TYPES.ECC,
  };

  public tlsAuthType = TLS_AUTH_TYPE.ServerCertAuth;

  public setCardReaderParameter(data: any): void {
    this.certReaderParameter = {
      ...this.certReaderParameter,
      ...data,
    };
  }

  setTlsAuthType(tlsValue: TLS_AUTH_TYPE): void {
    this.tlsAuthType = tlsValue;
  }

  cardsParametersByType(cardType: ECardTypes): TGetCardsParameter {
    if (cardType === ECardTypes.HBA) return this.hbaCardParameters;
    else if (cardType === ECardTypes.SMCB) return this.smcbCardParameters;
    else {
      throw Error('Not supported cardType: ' + cardType);
    }
  }

  setAuthSignParameter(data: Partial<TAuthSignParameter>): void {
    this.authSignParameter = {
      ...this.authSignParameter,
      ...data,
    };
  }

  setTlsEntryOptions(data: TEntryOptions): void {
    this.tlsEntryOptions = data;
    this.tlsEntryOptions.hostname = this.migrateToNewHostLogic(<TEntryOptions>data);
  }

  setContextParameters(data: TContextParameter): void {
    this.contextParameters = data;
  }

  /**
   * This function is used to migrate the old port logic to the new one.
   */
  migrateToNewHostLogic(entryOptions: Partial<TEntryOptions>): string {
    // check if hostname contains http,https or port. If yes it means it is already the new form
    const { hostname, port } = entryOptions;
    const isNewForm = hostname?.match(/^(http|https):\/\//) || hostname?.match(/:\d+$/);

    if (isNewForm) {
      // replace the last slash and return
      return hostname!.replace(/\/$/, '');
    }

    // in any other cases, we need to build the whole URL with https, domain and port, default port is 443
    return `https://${hostname}:${port}`;
  }

  /**
   * Update connector parameters on init and after save setting
   */
  updateConnectorParameters = (): void => {
    this.setContextParameters({
      ...this.contextParameters,
      ...getConfigGroup(CONTEXT_PARAMETERS_CONFIG_GROUP),
    });

    const entryOptions = getConfigGroup(ENTRY_OPTIONS_CONFIG_GROUP);

    this.setTlsEntryOptions({
      ...this.tlsEntryOptions,
      ...entryOptions,
    });

    this.setAuthSignParameter({ ...this.authSignParameter, ...getConfigGroup(AUTH_SIGN_PARAMETER_CONFIG_GROUP) });

    this.setTlsAuthType(<TLS_AUTH_TYPE>getConfig(TLS_AUTH_TYPE_CONFIG).value);
  };
}

export default new ConnectorConfig();
