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

import { TAuthSignParameter, TContextParameter, TEntryOptions, TGetCardsParameter } from '../type-definitions';
import { logger } from '@/renderer/service/logger';
import { getConfig, getConfigGroup } from '@/renderer/utils/get-configs';
import {
  AUTH_SIGN_PARAMETER_CONFIG_GROUP,
  CONTEXT_PARAMETERS_CONFIG_GROUP,
  ENTRY_OPTIONS_CONFIG_GROUP,
  TLS_AUTH_TYPE_CONFIG,
} from '@/config';
import { CARD_PIN_TYPES } from '@/renderer/modules/connector/constants';
import { TlsAuthType } from '@/@types/common-types';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

class ConnectorConfig {
  public tlsEntryOptions: TEntryOptions = {
    hostname: '127.0.0.1',
    port: 443,
    path: '/connector.sds',
    method: 'GET',
    secureProtocol: 'TLSv1_2_method',
    keyFile: 'not-defined',
    certFile: 'not-defined',
    pfxFile: 'not-defined',
    pfxPassword: 'not-defined',
    username: 'not-defined',
    password: 'not-defined',
    rejectUnauthorized: false,
    protocol: 'https',
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
    signatureType: 'urn:ietf:rfc:3447',
    signatureCidpSchemes: 'RSASSA-PSS',
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
    crypt: 'RSA',
  };

  public tlsAuthType = TlsAuthType.ServerCertAuth;

  setTlsAuthType(tlsValue: string): void {
    this.tlsAuthType = tlsValue;
  }

  cardsParametersByType(cardType: ECardTypes): TGetCardsParameter {
    if (cardType === ECardTypes.HBA) return this.hbaCardParameters;
    else if (cardType === ECardTypes.SMCB) return this.smcbCardParameters;
    else {
      throw Error('Not supported cardType: ' + cardType);
    }
  }

  setAuthSignParameter(data: TAuthSignParameter): void {
    this.authSignParameter = data;
  }

  setTlsEntryOptions(data: TEntryOptions): void {
    this.tlsEntryOptions = data;
  }

  setContextParameters(data: TContextParameter): void {
    this.contextParameters = data;
  }

  /**
   * This function replaces Connector's endpoints with our host parameter which defined in Settings Page
   * We need this mapping because, Kops gives us a wrong host name from docker container
   *
   * In case of leaving Kops, probably this function will be needless
   *
   * @param endpoint
   * @return string
   */
  mapEndpoint = (endpoint: string): string => {
    const uri = new URL(endpoint);
    uri.hostname = this.tlsEntryOptions.hostname;
    const url = new URL(uri.toString()).toString();
    logger.debug(`URI: ${uri.toString()} ?= ${url}`);
    return url;
  };

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

    this.setTlsAuthType(<string>getConfig(TLS_AUTH_TYPE_CONFIG).value);
  };
}

export default new ConnectorConfig();
