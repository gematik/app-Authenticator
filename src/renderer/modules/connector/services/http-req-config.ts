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

import { Headers, HTTPSOptions, Options } from 'got';

import { TEntryOptions } from '@/renderer/modules/connector/type-definitions';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { logger } from '@/renderer/service/logger';
import { buildCaChainsConnector } from '@/renderer/modules/connector/common/utils';
import { getConfig } from '@/renderer/utils/get-configs';
import { CONNECTOR_GATEWAY_NAME, ENTRY_OPTIONS_CONFIG_GROUP, PROXY_SETTINGS_CONFIG } from '@/config';
import { PROCESS_ENVS } from '@/constants';

/**
 * @param endpoint
 */
export const getConnectorEndpoint = (endpoint?: string) => {
  // tlsEntryOptions are always stable
  const tlsEntryOptions: TEntryOptions = ConnectorConfig.tlsEntryOptions;
  let path = tlsEntryOptions.path;

  // We change the path if it is provided if not we get the standard one from tlsEntryOptions
  if (endpoint) {
    const parsedEndpoint = new URL(endpoint);
    path = parsedEndpoint.pathname;
  }
  // #!if MOCK_MODE === 'ENABLED'
  else {
    /*
     Note: This will not work with the Konnektor Gateway!
     The Konnektor Service Platform itself has a mapping of the Konnektors
     in its route definition, e.g. https://url-of-konnektor-service-platform/kon23
     The Konnektor Gateway does the mapping with a custom header and has no
     konnektor name within the url

     However, this is required to be active for automatic integration testing!
     */
    path = mappingPath(path);
  }
  // #!endif

  return `https://${tlsEntryOptions.hostname}:${tlsEntryOptions.port}${path}`;
};

export const httpReqConfig = (headers?: Headers, customOptions?: Options): Options => {
  // tlsEntryOptions are always stable
  const tlsEntryOptions: TEntryOptions = ConnectorConfig.tlsEntryOptions;

  // TODO when adjusting authenticator to official konnektor gateway support,
  // we need to find a better way of parametrize the konnektor instance
  const reqConfig: Options = {
    // @ts-ignore
    useProxyForConnector: !!getConfig(PROXY_SETTINGS_CONFIG.USE_FOR_CONNECTOR).value,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      accept: '*/*',
      ...headers,
      'X-Konnektor-Gateway': String(getConfig(CONNECTOR_GATEWAY_NAME).value) || '',
    },
  };

  const rejectUnauthorized = !!getConfig(ENTRY_OPTIONS_CONFIG_GROUP.TLS_REJECT_UNAUTHORIZED).value;

  // The FQDN will never match a productive connector, so we always accept an unauthorized communication to a connector
  const agentConfig: HTTPSOptions = {
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

  // Merge `customOptions` so that any of its properties override the defaults:
  return {
    ...reqConfig,
    // Merge the HTTPS portion if `customOptions.https` exists
    https: {
      ...agentConfig,
      ...(customOptions?.https || {}),
    },
    // Merge/override everything else in customOptions
    ...customOptions,
    // Finally, merge headers if customOptions has them
    headers: {
      ...reqConfig.headers,
      ...(customOptions?.headers || {}),
    },
  };
};
// #!if MOCK_MODE === 'ENABLED'
function mappingPath(path: string): string {
  const konnFarmHost = 'ksp.ltuzd.telematik-test';

  let conFarmPath = '/kon12';

  if (PROCESS_ENVS.CONNECTOR_PATH) {
    conFarmPath = '/' + PROCESS_ENVS.CONNECTOR_PATH;
  }

  logger.debug('PROCESS_ENVS.CONNECTOR_PATH:' + PROCESS_ENVS.CONNECTOR_PATH);
  logger.debug('conFarmPath:' + conFarmPath);

  if (ConnectorConfig.tlsEntryOptions.hostname.includes(konnFarmHost)) {
    return conFarmPath + path;
  }
  return path;
}

// #!endif
