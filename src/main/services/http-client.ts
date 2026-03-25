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

import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { rootCertificates } from 'tls';
import * as process from 'node:process';

import { PROCESS_ENVS } from '@/constants';
import { ENTRY_OPTIONS_CONFIG_GROUP, TIMEOUT_PARAMETER_CONFIG } from '@/config';
import { APP_CA_CHAIN_IDP, APP_CONFIG_DATA } from '@/main/preload-api';
import { logger } from '@/main/services/logging';
import { createProxyAgent } from '@/main/services/proxyResolver';
import { HelperRequest, executeHelperRequest } from '@/main/services/spawned-node-helper';
import { toCertArray, putP12Config } from '@/main/services/http-tls-config';

export { HTTPClientConfig, HTTP_METHODS, TClientRes } from '@/main/services/http-client-types';
import { HTTPClientConfig, HTTP_METHODS, TClientRes } from '@/main/services/http-client-types';

/**
 * Normalize connector URL - replace IP with hostname if needed.
 * The connector may return endpoints with IP addresses, but TLS requires hostname for SNI.
 */
function normalizeConnectorUrl(url: string): string {
  const connectorHostname = APP_CONFIG_DATA[ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME] as string;
  if (!connectorHostname) return url;

  try {
    const urlObj = new URL(url);
    const isIpAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname);
    if (isIpAddress) {
      let targetHostname = connectorHostname;
      if (connectorHostname.includes('://')) {
        const configUrlObj = new URL(connectorHostname);
        targetHostname = configUrlObj.hostname;
      } else if (connectorHostname.includes(':')) {
        targetHostname = connectorHostname.split(':')[0];
      }
      urlObj.hostname = targetHostname;
      logger.debug(`normalizeConnectorUrl: ${url} -> ${urlObj.toString()}`);
      return urlObj.toString();
    }
  } catch {
    // If URL parsing fails, return original
  }
  return url;
}

function extractProxyUrl(proxy: HttpProxyAgent | HttpsProxyAgent | undefined): {
  url?: string;
  username?: string;
  password?: string;
} {
  if (!proxy) return {};

  const proxyObj = (proxy as any).proxy;
  if (proxyObj && typeof proxyObj === 'object' && proxyObj.href) {
    const proxyUrl = new URL(proxyObj.href);
    const username = proxyUrl.username || undefined;
    const password = proxyUrl.password || undefined;
    proxyUrl.username = '';
    proxyUrl.password = '';
    return {
      url: proxyUrl.href,
      username,
      password,
    };
  }

  return {};
}

export const httpClient = async (
  method: HTTP_METHODS,
  url: string,
  config: HTTPClientConfig = {},
  envelope?: any,
): Promise<TClientRes | undefined> => {
  const normalizedUrl = normalizeConnectorUrl(url);

  try {
    let requestTimeout: number;
    if (config.timeout !== undefined) {
      requestTimeout = config.timeout;
    } else if (APP_CONFIG_DATA[TIMEOUT_PARAMETER_CONFIG] !== undefined) {
      requestTimeout = Number(APP_CONFIG_DATA[TIMEOUT_PARAMETER_CONFIG]);
    } else {
      requestTimeout = 30000;
    }

    // Build CA certificates array (custom certs only, NOT rootCertificates).
    // On Windows, --openssl-legacy-provider crashes (0xC0000005) when total CA certs exceed ~159.
    // Node.js has ~146 built-in root certs, so adding them here would push us over the limit.
    // The helper process already has access to root certs via its default trust store.
    const caCertificates: string[] = [
      ...toCertArray(config?.https?.certificateAuthority).map((c) => c.toString()),
      ...APP_CA_CHAIN_IDP,
    ];

    const headers: Record<string, string | string[]> = {
      ...(typeof config.headers === 'object' && config.headers !== null ? config.headers : {}),
    };

    // #!if MOCK_MODE === 'ENABLED'
    if (PROCESS_ENVS.IDP_DEV_API_KEY) {
      headers['X-Authorization'] = PROCESS_ENVS.IDP_DEV_API_KEY as string;
    }
    // #!endif

    let body: string | undefined;
    if (method === HTTP_METHODS.POST) {
      if (config.json) {
        body = JSON.stringify(config.json);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else if (typeof envelope === 'object') {
        body = JSON.stringify(envelope);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else if (config.body) {
        body = config.body;
      } else if (envelope !== undefined) {
        body = String(envelope);
      }
    }

    let proxy: HttpProxyAgent | HttpsProxyAgent | undefined;

    // We create a proxy agent if 'useProxyForConnector' is undefined or set to true,
    // which happens in the communication between authenticator and idp.
    if (typeof config.useProxyForConnector === 'undefined' || config.useProxyForConnector) {
      proxy = await createProxyAgent(normalizedUrl, rootCertificates);
    }

    // In the macOS Pipeline, we need the proxy always
    // #!if MOCK_MODE === 'ENABLED'
    if (process.platform === 'darwin' && process.env.NODE_ENV?.includes('test')) {
      proxy = await createProxyAgent(normalizedUrl);
    }
    // #!endif

    if (proxy) {
      // @ts-ignore we don't get debug messages from the ipcRenderer in createProxyAgent, so we log it here
      logger.debug('Proxy for: ' + normalizedUrl + ' is:' + (proxy as any)?.proxy);
    }

    const proxyInfo = extractProxyUrl(proxy);

    if (config.username && config.password) {
      const basicAuth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    const helperRequest: HelperRequest = {
      url: normalizedUrl,
      method: method === HTTP_METHODS.POST ? 'POST' : 'GET',
      headers: headers,
      body: body,
      timeout: requestTimeout || 30000,
      caCertificates: caCertificates,
      ciphers: config.ciphers,
      rejectUnauthorized: config.https?.rejectUnauthorized !== false,
      followRedirect: config.followRedirect ?? false,
      proxyUrl: proxyInfo.url,
      proxyUsername: proxyInfo.username,
      proxyPassword: proxyInfo.password,
    };

    const p12Config = putP12Config();
    if (p12Config.pfx) {
      helperRequest.pfxBase64 = p12Config.pfx.toString('base64');
      helperRequest.pfxPassword = p12Config.passphrase;
      logger.debug(`PFX certificate loaded for mTLS (${p12Config.pfx.length} bytes)`);
    }

    if (config.https?.key) {
      const keyData = Array.isArray(config.https.key) ? config.https.key[0] : config.https.key;
      helperRequest.keyPem = keyData.toString();
    }
    if (config.https?.certificate) {
      const certData = Array.isArray(config.https.certificate) ? config.https.certificate[0] : config.https.certificate;
      helperRequest.certPem = certData.toString();
    }

    logger.debug(`httpClient ${helperRequest.method} to ${normalizedUrl}`);

    return await executeHelperRequest(helperRequest, normalizedUrl);
  } catch (err: any) {
    logger.error('http error for url: ' + normalizedUrl, err);

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
