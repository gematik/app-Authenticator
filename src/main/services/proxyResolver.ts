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

import { ipcRenderer } from 'electron';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { IPC_GET_PROXY } from '@/constants';
import { PROXY_AUTH_TYPES, PROXY_SETTINGS_CONFIG } from '@/config';
import fs from 'fs';
import { logger } from '@/main/services/logging';
import { APP_CA_CHAIN_IDP, APP_CONFIG_DATA } from '@/main/preload-api';
import { matches as ipMatches } from 'ip-matching';
import { minimatch } from 'minimatch';
import * as dns from 'dns';
import isValidDomain = require('is-valid-domain');

type TReturnType = Promise<HttpsProxyAgent | HttpProxyAgent | undefined>;

export async function createProxyAgent(url: string, trustStoreCertificates: readonly string[] = []): TReturnType {
  const proxyUrl = await getProxyUrl(url);

  logger.info('custom proxyUrl', proxyUrl);
  // #!if MOCK_MODE === 'ENABLED'
  // This is only for the macOS Pipeline
  const pCert = getProxyCertificate();
  if (!proxyUrl && process.env.BUILD_ID && process.env.http_proxy) {
    return new HttpsProxyAgent({
      proxy: process.env.http_proxy,
      ca: fs.readFileSync('src/assets/certs-konnektor/ru/Gematik-Intern-ZD-Root-CA.crt'),
      cert: pCert,
      requestCert: !!pCert,
    });
  }
  // #!endif

  if (!proxyUrl) {
    return undefined;
  }
  const shouldBypass = await shouldBypassProxy(url);
  if (shouldBypass) {
    logger.info(`Bypassing proxy for URL: ${url}`);
    return undefined;
  }
  const proxyAuthSettings = getProxyAuthSettings();
  return createAgent(url, proxyUrl, proxyAuthSettings, trustStoreCertificates);
}

/** Helper Functions */
// determination of proxy URL based on OS settings or application configuration.
async function getProxyUrl(url: string): Promise<string | undefined> {
  const useOsSetting = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS];
  let proxyUrl: string | undefined;

  if (useOsSetting || useOsSetting === undefined) {
    proxyUrl = (await ipcRenderer.sendSync(IPC_GET_PROXY, url)) as string;
    logger.info('Proxy URL obtained from OS settings');
  } else {
    const host = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_ADDRESS] as string;
    const port = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_PORT];
    proxyUrl = `${host}:${port}`;
    logger.info('Proxy URL obtained from app configuration');
  }

  if (proxyUrl) {
    return proxyUrl;
  } else {
    logger.info('No proxy URL found');
    return undefined;
  }
}

// bypass based on proxy ignore list
async function shouldBypassProxy(url: string): Promise<boolean> {
  const proxyIgnoreList = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST] as string;
  if (!proxyIgnoreList?.trim()) {
    return false;
  }

  const proxyIgnoreEntries = proxyIgnoreList.split(';');

  for (const entry of proxyIgnoreEntries) {
    const isDomainEntry = isValidDomain(entry, { wildcard: true });

    if (isDomainEntry && isDomainIgnored(url, entry)) {
      return true;
    }

    if (!isDomainEntry && (await isIpIgnored(url, entry))) {
      return true;
    }
  }

  return false;
}

function isDomainIgnored(url: string, entry: string): boolean {
  const host = new URL(url).host;

  if (minimatch(host, entry)) {
    logger.info(`URL ${url} is ignored based on domain entry ${entry}`);
    logger.debug(`ProxyIgnoreEntry: ${entry}, Host: ${host}`);
    return true;
  }

  return false;
}

async function isIpIgnored(url: string, entry: string): Promise<boolean> {
  try {
    const ipAddress = await getIpAddress(url);
    if (!ipAddress) {
      return false;
    }

    if (ipMatches(ipAddress, entry)) {
      logger.info(`IP address ${ipAddress} of URL ${url} is ignored based on IP entry ${entry}`);
      logger.debug(`ProxyIgnoreEntry: ${entry}, IP Address: ${ipAddress}`);
      return true;
    }
  } catch (error) {
    logger.error(`Error checking IP ignore list: ${error}`);
  }

  return false;
}

// resolves the IP address for a given URL
async function getIpAddress(url: string): Promise<string | false> {
  return new Promise((resolve) => {
    const hostname = new URL(url).hostname;

    // DNS lookup with a timeout
    const timer = setTimeout(() => {
      logger.debug(`DNS lookup timed out for hostname: ${hostname}`);
      resolve(false);
    }, 200);

    dns.lookup(hostname, (err: NodeJS.ErrnoException | null, address: string) => {
      clearTimeout(timer);
      if (err) {
        logger.debug(`Error resolving IP address for ${hostname}: ${err ? err.message : 'Unknown error'}`);
        resolve(false);
      } else {
        resolve(address);
      }
    });
  });
}

function getProxyAuthSettings(): { username: string; password: string } | undefined {
  if (APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.AUTH_TYPE] === PROXY_AUTH_TYPES.BASIC_AUTH) {
    const username = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_USERNAME] as string;
    const password = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_PASSWORD] as string;
    logger.info('Using basic authentication for proxy');
    return { username, password };
  }
  return undefined;
}

function getProxyCertificate(): string | undefined {
  const proxyCertificatePath = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH];
  const isClientCertAuth = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.AUTH_TYPE] === PROXY_AUTH_TYPES.PROXY_CLIENT_CERT;
  const clientCertPathExists = typeof proxyCertificatePath === 'string';

  if (isClientCertAuth && clientCertPathExists) {
    try {
      const certificate = fs.readFileSync(proxyCertificatePath, 'utf8');
      logger.info('Proxy client certificate loaded');
      return certificate;
    } catch (error) {
      logger.error(`Error reading proxy certificate from ${proxyCertificatePath}: ${error}`);
      return undefined;
    }
  }
  return undefined;
}

function createAgent(
  url: string,
  proxyUrl: string,
  authSettings: { username: string; password: string } | undefined,
  trustStoreCertificates: readonly string[],
): HttpsProxyAgent | HttpProxyAgent {
  const destinationUrl = new URL(url);
  const isSecure = destinationUrl.protocol === 'https:';
  const proxy = new URL(proxyUrl);

  if (authSettings) {
    proxy.username = authSettings.username;
    proxy.password = authSettings.password;
    logger.info('Proxy authentication credentials set');
  }

  const caCertificates = APP_CA_CHAIN_IDP.length === 0 ? undefined : [...trustStoreCertificates, ...APP_CA_CHAIN_IDP];

  const proxyCertificate = getProxyCertificate();

  if (isSecure) {
    logger.info('Creating HttpsProxyAgent for secure connection');
    return new HttpsProxyAgent({
      proxy,
      ca: caCertificates,
      cert: proxyCertificate,
      requestCert: !!proxyCertificate,
    });
  } else {
    logger.info('Creating HttpProxyAgent for non-secure connection');
    return new HttpProxyAgent({
      proxy,
      proxyRequestOptions: {
        ca: caCertificates,
      },
    });
  }
}
