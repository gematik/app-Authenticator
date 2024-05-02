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

import { Headers, HTTPSOptions, Options } from 'got';

import { TEntryOptions } from '@/renderer/modules/connector/type-definitions';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { TlsAuthType } from '@/@types/common-types';
import { logger } from '@/renderer/service/logger';
import { buildCaChainsConnector } from '@/renderer/modules/connector/common/utils';
import { getConfig } from '@/renderer/utils/get-configs';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';
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
  } else {
    path = mappingPath(path);
  }

  return `https://${tlsEntryOptions.hostname}:${tlsEntryOptions.port}${path}`;
};

export const httpReqConfig = (headers?: Headers): Options => {
  // tlsEntryOptions are always stable
  const tlsEntryOptions: TEntryOptions = ConnectorConfig.tlsEntryOptions;

  const reqConfig: Options = {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      accept: '*/*',
      ...headers,
    },
  };

  const rejectUnauthorized = !!getConfig(ENTRY_OPTIONS_CONFIG_GROUP.TLS_REJECT_UNAUTHORIZED).value;

  // The FQDN will never match a productive connector, so we always accept an unauthorized communication to a connector
  const agentConfig: HTTPSOptions = {
    rejectUnauthorized,
    certificateAuthority: buildCaChainsConnector(),
  };

  if (ConnectorConfig.tlsAuthType == TlsAuthType.BasicAuth) {
    if (tlsEntryOptions.username && tlsEntryOptions.password) {
      reqConfig.username = tlsEntryOptions.username;
      reqConfig.password = tlsEntryOptions.password;
    } else logger.warn('Missing credentials for Basic Auth');
  } else if (ConnectorConfig.tlsAuthType == TlsAuthType.ServerClientCertAuth) {
    const keyFile = ConnectorConfig.tlsEntryOptions.keyFile;
    const certFile = ConnectorConfig.tlsEntryOptions.certFile;
    agentConfig.key = keyFile && window.api.readFileSync(keyFile);
    agentConfig.certificate = certFile && window.api.readFileSync(certFile);
  }

  return {
    ...reqConfig,
    https: agentConfig,
  };
};

function mappingPath(path: string): string {
  const konnFarmHost = 'ksp.ltuzd.telematik-test';
  const keyKonnektorKonnFarm = 'konnektor_konnFarm';

  let conFarmPath = '/kon23';

  if (PROCESS_ENVS.CONNECTOR_PATH) {
    conFarmPath = '/' + PROCESS_ENVS.CONNECTOR_PATH;
  }

  logger.debug('PROCESS_ENVS.CONNECTOR_PATH:' + PROCESS_ENVS.CONNECTOR_PATH);
  logger.debug('conFarmPath:' + conFarmPath);

  if (ConnectorConfig.tlsEntryOptions.hostname.includes(konnFarmHost)) {
    return getConfig(keyKonnektorKonnFarm, conFarmPath).value + path;
  }
  return path;
}
