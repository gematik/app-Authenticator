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

import { ipcRenderer } from 'electron';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { IPC_GET_PROXY } from '@/constants';
import { PROXY_AUTH_TYPES, PROXY_SETTINGS_CONFIG } from '@/config';
import fs from 'fs';
import { logger } from '@/main/services/logging';
import { APP_CA_CHAIN_IDP, APP_CONFIG_DATA } from '@/main/preload-api';
import isFQDN from 'validator/lib/isFQDN';
import { matches as ipMatches } from 'ip-matching';
import { minimatch } from 'minimatch';
import * as dns from 'dns';

type TReturnType = Promise<HttpsProxyAgent | HttpProxyAgent | undefined>;

export async function createProxyAgent(url: string): TReturnType {
  let proxyUrl;
  //default behavior is always the os setting, also when nothing is set
  const useOsSetting = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS];
  if (useOsSetting || useOsSetting === undefined) {
    proxyUrl = (await ipcRenderer.sendSync(IPC_GET_PROXY, url)) as string;
    logger.info('Proxy url picked from os settings');
  } else {
    const host = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_ADDRESS] as string;
    const port = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_PORT];
    proxyUrl = host + ':' + port;
    logger.info('Proxy url picked from config');
  }
  logger.debug('proxy url is:' + proxyUrl);
  const ignoreProxyForUrl = await isUrlInProxyIgnoreList(url);
  logger.debug('ignore destination url:' + ignoreProxyForUrl);

  if (proxyUrl && !ignoreProxyForUrl) {
    logger.info('Proxy url exists and is not ignored');

    const proxy = new URL(proxyUrl);
    const destinationUrl = new URL(url);
    const isSecure = destinationUrl.protocol === 'https:';
    const proxyBasicAuthSettings = getProxyBasicAuthSettings();

    // set username and password for basic auth
    if (proxyBasicAuthSettings?.username && proxyBasicAuthSettings?.password) {
      logger.info('App uses basic auth for proxy');

      proxy.username = proxyBasicAuthSettings.username;
      proxy.password = proxyBasicAuthSettings.password;
    }

    const caIdp = APP_CA_CHAIN_IDP.length === 0 ? undefined : APP_CA_CHAIN_IDP;

    const proxyCertificate = getProxyCertificate();
    if (isSecure) {
      logger.info('Proxy url is an https secure url');
      return new HttpsProxyAgent({
        proxy,
        ca: caIdp,
        cert: proxyCertificate,
        requestCert: !!proxyCertificate,
      });
    }

    logger.info('Proxy url is an http url or no url');
    return new HttpProxyAgent({
      proxy,
      proxyRequestOptions: {
        ca: caIdp,
      },
    });
  }
}

const isUrlInProxyIgnoreList = async (proxyUrl: string): Promise<boolean> => {
  const proxyIgnoreList = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST] as string;

  if (!proxyIgnoreList?.trim()) {
    return false;
  }

  if (!proxyUrl) {
    logger.info('Could not resolve ip address for the proxy ignore list');
    return false;
  }

  const proxyIgnoreEntries = proxyIgnoreList.split(';');

  for (const proxyIgnoreEntry of proxyIgnoreEntries) {
    // if this is a fqdn and it matches the proxy url, return true
    if (isFQDN(proxyIgnoreEntry, { allow_wildcard: true }) && isFqdnInProxyIgnoreList(proxyUrl, proxyIgnoreEntry)) {
      return true;
    }

    try {
      // if this is an ip address, and it matches the proxy url, return true
      if (await isIpInProxyIgnoreList(proxyUrl, proxyIgnoreEntry)) {
        return true;
      }
    } catch (e) {
      // if the ip address is not valid, continue with the next entry
    }
  }
  return false;
};

const isFqdnInProxyIgnoreList = (proxyUrl: string, proxyIgnoreEntry: string): boolean => {
  const parsedProxyUrl = new URL(proxyUrl);
  const host = parsedProxyUrl.host;

  const isUrlInProxyIgnoreListResult = minimatch(host, proxyIgnoreEntry);

  logger.info('isUrlInProxyIgnoreListResult' + isUrlInProxyIgnoreListResult);
  if (isUrlInProxyIgnoreListResult) {
    logger.info('URL is in proxy ignore list');
    logger.debug(
      'ProxyIgnoreEntry:' +
        proxyIgnoreEntry +
        ', Address for URL:' +
        host +
        ', is proxyURL in proxy ignore range:' +
        isUrlInProxyIgnoreListResult,
    );
    return true;
  }

  return false;
};

const isIpInProxyIgnoreList = async (proxyUrl: string, proxyIgnoreEntry: string): Promise<boolean> => {
  const ipAddress = await getIpAddress(proxyUrl);

  if (!ipAddress) {
    logger.info('Could not resolve ip address for the proxy ignore list');
    return false;
  }

  try {
    const isUrlInIpRange = ipMatches(ipAddress, proxyIgnoreEntry);
    if (isUrlInIpRange) {
      logger.info('IP-address is in proxy ignore list');
      logger.debug(
        'ProxyIgnoreEntry:' +
          proxyIgnoreEntry +
          ', IP-Address for URL:' +
          ipAddress +
          ', is proxyURL in proxy ignore range:' +
          isUrlInIpRange,
      );
      return isUrlInIpRange;
    }

    return false;
  } catch (e) {
    return false;
  }
};

async function getIpAddress(href: string): Promise<string | false> {
  return new Promise((resolve, reject) => {
    // timeout for dns lookup, if it takes longer than 200ms, reject with false
    const timer = setTimeout(() => {
      resolve(false);
    }, 200);

    dns.lookup(new URL(href).host, (err, address) => {
      clearTimeout(timer); // Clear the timer if DNS lookup completes
      if (err) {
        reject(false); // Reject with false on error
        logger.debug('Error while resolving ip address for url:' + href + ', error:' + err);
      } else {
        resolve(address); // Resolve with the address on success
      }
    });
  });
}

const getProxyBasicAuthSettings = (): void | { password: string; username: string } => {
  if (APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.AUTH_TYPE] === PROXY_AUTH_TYPES.BASIC_AUTH) {
    return {
      username: APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_USERNAME] as string,
      password: APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_PASSWORD] as string,
    };
  }
};

const getProxyCertificate = (): undefined | string => {
  const proxyCertificatePath = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH];
  const isClientCertAuth = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.AUTH_TYPE] === PROXY_AUTH_TYPES.PROXY_CLIENT_CERT;
  const clientCertPathExists = typeof proxyCertificatePath === 'string';

  if (isClientCertAuth && clientCertPathExists) {
    try {
      return fs.readFileSync(proxyCertificatePath, 'utf8');
    } catch (e) {
      return undefined;
    }
  }

  return undefined;
};
