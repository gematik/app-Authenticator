/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { HTTPSOptions, OptionsOfTextResponseBody } from 'got';
import { OutgoingHttpHeaders } from 'http';

import { TEntryOptions } from '@/renderer/modules/connector/type-definitions';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { TlsAuthType } from '@/@types/common-types';
import { logger } from '@/renderer/service/logger';
import { buildCaChainsConnector } from '@/renderer/modules/connector/common/utils';
import { getConfig } from '@/renderer/utils/get-configs';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';

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

export const httpReqConfig = (headers?: OutgoingHttpHeaders): OptionsOfTextResponseBody => {
  // tlsEntryOptions are always stable
  const tlsEntryOptions: TEntryOptions = ConnectorConfig.tlsEntryOptions;

  const reqConfig: OptionsOfTextResponseBody = {
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

//TODO: Klaeren ob ähnliche Struktur wie Konnektor-farm (KSP) auch in Krankenhaeusern vorhanden ist. Settings muss ggf. dafuer aufgebohrt werden.
function mappingPath(path: string): string {
  const konnFarmHost = 'eau.dev.top.local';
  const keyKonnektorKonnFarm = 'konnektor_konnFarm';
  const defaultKonnektorKonnfarm = '/kon23';
  // Todo : Hier auch andere Konnektoren der Farm ermöglichen / nicht hardcoden !!! z.B. '/kon23';
  if (ConnectorConfig.tlsEntryOptions.hostname.includes(konnFarmHost)) {
    return getConfig(keyKonnektorKonnFarm, defaultKonnektorKonnfarm).value + path;
  }
  return path;
}
