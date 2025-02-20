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

import got from 'got';
import fs from 'fs';
import { IncomingHttpHeaders } from 'http';
import { stringify } from 'flatted';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';

import { IS_TEST, PROCESS_ENVS } from '@/constants';
import { logger } from '@/main/services/logging';
import { createProxyAgent } from '@/main/services/proxyResolver';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { ENTRY_OPTIONS_CONFIG_GROUP, TIMEOUT_PARAMETER_CONFIG, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { APP_CONFIG_DATA } from '@/main/preload-api';
import * as process from 'node:process';

const { CookieJar } = require('tough-cookie');
const cookieJar = new CookieJar();

// let trustStoreCertificates: string[] = [];

// ipcRenderer
//   .invoke(IPC_READ_CERTIFICATES)
//   .then((certificates) => {
//     trustStoreCertificates = certificates;
//     logger.info('Retrieved trust store certificates: ' + trustStoreCertificates.length);
//   })
//   .catch((error) => {
//     logger.error('Error retrieving trust store certificates:', error);
//   });

let gotAdvanced = got;
// #!if MOCK_MODE === 'ENABLED'
if (!IS_TEST) {
  gotAdvanced = got.extend({
    hooks: {
      afterResponse: [
        (response) => {
          logger.debug(`afterResponse to ${response.url}`);
          // No changes otherwise
          return response;
        },
      ],
      beforeRequest: [
        (options) => {
          logger.debug(`beforeRequest ${options.method} to ${options.url}`);
        },
      ],
      beforeError: [
        (error) => {
          const { response } = error;
          logger.debug(`beforeError data:\n${stringify(response?.body)}`);
          return error;
        },
      ],
    },
  });
}

// #!endif

export enum HTTP_METHODS {
  POST,
  GET,
}

export type TClientRes = {
  data: any;
  status: number;
  headers?: IncomingHttpHeaders;
};

export const httpClient = async (
  method: HTTP_METHODS,
  url: string,
  config: any = {},
  envelope?: any,
): Promise<TClientRes | undefined> => {
  try {
    if (method === HTTP_METHODS.POST) {
      if (typeof envelope === 'object') {
        config.json = envelope;
      } else {
        config.body = envelope;
      }
    }
    // put p12 certificate
    config = {
      ...config,
      timeout: {
        ...config.timeout,
        // it the variable specifically defined, use it, this is required for verifyPIN requests
        // if it is not defined, use the value from the config file, otherwise use 30 seconds
        request: config.timeout?.request || <number>APP_CONFIG_DATA[TIMEOUT_PARAMETER_CONFIG] || 30000,
      },
      https: {
        ...config.https,
        // certificateAuthority: [...(config?.https?.certificateAuthority || [])],
        ...putP12Config(url),
      },
    };

    // #!if MOCK_MODE === 'ENABLED'
    // add header for https://idp.dev.gematik.solutions/
    config.headers = {
      ...config.headers,
      'X-Authorization': PROCESS_ENVS.IDP_DEV_API_KEY,
    };
    // #!endif

    let proxy;

    // We create a proxy agent if 'useProxyForConnector' is undefined or set to true,
    // which happens in the communication between authenticator and ipd.
    if (typeof config.useProxyForConnector === 'undefined' || config.useProxyForConnector) {
      proxy = await createProxyAgent(url);
    }
    delete config?.useProxyForConnector;

    // In the macOS Pipeline, we need the proxy always
    // #!if MOCK_MODE === 'ENABLED'
    if (process.platform === 'darwin' && process.env.NODE_ENV?.includes('test')) {
      proxy = await createProxyAgent(url);
    }
    // #!endif

    if (proxy) {
      // @ts-ignore we don't get debug messages from the ipcRenderer in createProxyAgent, so we log it here
      logger.debug('Proxy for: ' + url + ' is:' + proxy?.proxy);
    }

    const client = method === HTTP_METHODS.POST ? gotAdvanced.post : gotAdvanced.get;
    const res = client(url, {
      followRedirect: false, // default false, can be superseded by config.followRedirect
      ...config,
      cookieJar,
      agent: {
        https: proxy instanceof HttpsProxyAgent ? proxy : undefined,
        http: proxy instanceof HttpProxyAgent ? proxy : undefined,
      },
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = await res.text();
    }

    const response = await res;

    return {
      data,
      status: response.statusCode,
      headers: response.headers,
    };
  } catch (err) {
    logger.error('http error for url: ' + url, err);

    if (
      err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
      err.message.includes('Hostname/IP does not match certificate´s altnames')
    ) {
      err.message =
        err.message + ' Please see No. 15 in https://wiki.gematik.de/pages/viewpage.action?pageId=474101686';
    }
    /**
     * Electron doesn't allow us to carry information in an Error instance to renderer process.
     * That's why we throw an object instead of new Error()
     */
    throw {
      message: err.message,
      response: {
        url: err.response?.url,
        body: err.response?.body,
        headers: err.response?.headers,
        statusCode: err.response?.statusCode,
      },
    };
  }
};

/**
 * Electron doesn't allow us to read pfx (p12)-Files in the renderer process
 * That´s why this function is implemented here and not in http-req-config.ts like the function for pem-files
 */
const putP12Config = (url: string) => {
  // ignore idp requests
  const connectorHost = <string>APP_CONFIG_DATA[ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME];
  if (!url?.includes(connectorHost)) {
    return {};
  }

  if (APP_CONFIG_DATA[TLS_AUTH_TYPE_CONFIG] != TLS_AUTH_TYPE.ServerClientCertAuth_Pfx) {
    return {};
  }

  const pfxFile = APP_CONFIG_DATA[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE];
  const pfxPassword = APP_CONFIG_DATA[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD];

  if (pfxFile && typeof pfxFile === 'string') {
    return {
      pfx: fs.readFileSync(pfxFile),
      passphrase: pfxPassword,
    };
  } else {
    logger.warn('Missing pfx file for ServerClientCertAuth_Pfx');
  }
};
