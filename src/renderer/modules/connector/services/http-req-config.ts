/*
 * Copyright 2026, gematik GmbH
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

import { TEntryOptions } from '@/renderer/modules/connector/type-definitions';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { logger } from '@/renderer/service/logger';
import { buildCaChainsConnector } from '@/renderer/modules/connector/common/utils';
import { getConfig } from '@/renderer/utils/get-configs';
import { CONNECTOR_GATEWAY_NAME, ENTRY_OPTIONS_CONFIG_GROUP, PROXY_SETTINGS_CONFIG } from '@/config';
import { HTTPClientConfig } from '@/main/services/http-client';
import { CONNECTOR_CIPHERS } from '@/constants';

type Headers = Record<string, string | string[] | undefined>;

export const httpReqConfig = (headers?: Headers, customOptions?: HTTPClientConfig): HTTPClientConfig => {
  // tlsEntryOptions are always stable
  const tlsEntryOptions: TEntryOptions = ConnectorConfig.tlsEntryOptions;

  // TODO when adjusting authenticator to official konnektor gateway support,
  // we need to find a better way of parametrize the konnektor instance
  const reqConfig: Partial<HTTPClientConfig> = {
    useProxyForConnector: !!getConfig(PROXY_SETTINGS_CONFIG.USE_FOR_CONNECTOR).value,
    ciphers: CONNECTOR_CIPHERS.join(':'),
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      accept: '*/*',
      ...headers,
      'X-Konnektor-Gateway': String(getConfig(CONNECTOR_GATEWAY_NAME).value) || '',
    },
  };

  const rejectUnauthorized = !!getConfig(ENTRY_OPTIONS_CONFIG_GROUP.TLS_REJECT_UNAUTHORIZED).value;

  // The FQDN will never match a productive connector, so we always accept an unauthorized communication to a connector
  const agentConfig: HTTPClientConfig['https'] = {
    rejectUnauthorized,
    certificateAuthority: buildCaChainsConnector(),
  };
  if (ConnectorConfig.tlsAuthType == TLS_AUTH_TYPE.BasicAuth) {
    if (tlsEntryOptions.username && tlsEntryOptions.password) {
      reqConfig.username = tlsEntryOptions.username;
      reqConfig.password = tlsEntryOptions.password;
    } else logger.warn('Missing credentials for Basic Auth');
  } else if (ConnectorConfig.tlsAuthType == TLS_AUTH_TYPE.ServerClientCertAuth) {
    const keyFile = ConnectorConfig.tlsEntryOptions.keyFile;
    const certFile = ConnectorConfig.tlsEntryOptions.certFile;
    agentConfig.key = keyFile && window.api.readFileSync(keyFile);
    agentConfig.certificate = certFile && window.api.readFileSync(certFile);
  }

  return {
    ...reqConfig,
    https: {
      ...agentConfig,
      ...(customOptions?.https || {}),
    },
    ...customOptions,
    headers: {
      ...(reqConfig.headers as Record<string, string | string[]>),
      ...(customOptions?.headers || {}),
    },
  };
};
