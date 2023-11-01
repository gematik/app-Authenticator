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

import { ipcRenderer } from 'electron';
import { matches } from 'ip-matching';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { IPC_GET_PROXY } from '@/constants';
import { PROXY_AUTH_TYPES, PROXY_SETTINGS_CONFIG } from '@/config';
import fs from 'fs';
import dns from 'dns';
import { logger } from '@/main/services/logging';
import { APP_CA_CHAIN_IDP, APP_CONFIG_DATA } from '@/main/preload-api';

type TReturnType = Promise<HttpsProxyAgent | HttpProxyAgent | undefined>;

export async function createProxyAgent(url: string): TReturnType {
  let proxyUrl;
  //default behavior is always the os setting, also when nothing is set
  const useOsSetting = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS];
  if (useOsSetting || useOsSetting === undefined) {
    proxyUrl = (await ipcRenderer.sendSync(IPC_GET_PROXY, url)) as string;
  } else {
    const host = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_ADDRESS] as string;
    const port = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_PORT];
    proxyUrl = host + ':' + port;
  }
  logger.debug('proxy url is:' + proxyUrl);
  const ignoreProxyForUrl = await isUrlInProxyIgnoreList(url);
  logger.debug('ignore destination url:' + ignoreProxyForUrl);

  if (proxyUrl && !ignoreProxyForUrl) {
    const proxy = new URL(proxyUrl);
    const destinationUrl = new URL(url);
    const isSecure = destinationUrl.protocol === 'https:';
    const proxyBasicAuthSettings = getProxyBasicAuthSettings();

    // set username and password for basic auth
    proxy.username = typeof proxyBasicAuthSettings?.username === 'string' ? proxyBasicAuthSettings.username : '';
    proxy.password = typeof proxyBasicAuthSettings?.password === 'string' ? proxyBasicAuthSettings.password : '';

    const caIdp = APP_CA_CHAIN_IDP.length === 0 ? undefined : APP_CA_CHAIN_IDP;

    const proxyCertificate = getProxyCertificate();
    if (isSecure) {
      return new HttpsProxyAgent({
        proxy,
        ca: caIdp,
        cert: proxyCertificate,
        requestCert: !!proxyCertificate,
      });
    }

    return new HttpProxyAgent({
      proxy,
      proxyRequestOptions: {
        ca: caIdp,
      },
    });
  }
}

const isUrlInProxyIgnoreList = async (url: string): Promise<boolean> => {
  const proxyIgnoreList = APP_CONFIG_DATA[PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST] as string;
  if (proxyIgnoreList) {
    const proxyIgnoreEntries = proxyIgnoreList.split(';');
    for (const proxyIgnoreEntry of proxyIgnoreEntries) {
      const ipAddress = await geIpAddress(url);
      if (ipAddress) {
        const isUrlInIpRange = matches(ipAddress, proxyIgnoreEntry);
        logger.debug(
          'ProxyIgnoreEntry:' +
            proxyIgnoreEntry +
            ', ipAddress for Url:' +
            ipAddress +
            ', is url in proxy ignore range:' +
            isUrlInIpRange,
        );
        if (isUrlInIpRange) {
          return isUrlInIpRange;
        }
      }
    }
  }
  return false;
};

async function geIpAddress(href: string) {
  let resVal = undefined;
  dns.lookup(new URL(href).host, (err, address) => {
    resVal = err ? false : address;
    return resVal;
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  return resVal;
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
      return fs.readFileSync(proxyCertificatePath, 'utf-8');
    } catch (e) {
      return undefined;
    }
  }

  return undefined;
};
