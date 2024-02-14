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

/**
 * @jest-environment jsdom
 */

import { ipcRenderer } from 'electron';
import { createProxyAgent } from '@/main/services/proxyResolver';
import { HttpsProxyAgent } from 'hpagent';
import { preloadApi } from '@/main/preload-api';
import { SAMPLE_CONFIG_DATA } from '../utils/config-sample-data';
import { PROXY_AUTH_TYPES, PROXY_SETTINGS_CONFIG } from '@/config';
import fs from 'fs';

describe('proxyResolver', () => {
  beforeEach(() => {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
    });
  });
  it('createHttpsProxyAgentWithHttpProxy', async function () {
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = await createProxyAgent('https://Server.com');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBe('http://192.168.1.1/');

    // @ts-ignore
    expect(proxyAgent?.defaultPort).toBe(443);

    // @ts-ignore
    expect(proxyAgent?.proxy?.protocol).toBe('http:');
  });
  it('createHttpsProxyAgentWithHttpsProxy', async function () {
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('https://192.168.1.1');
    const proxyAgent = await createProxyAgent('https://Server.com');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBe('https://192.168.1.1/');

    // @ts-ignore
    expect(proxyAgent?.defaultPort).toBe(443);

    // @ts-ignore
    expect(proxyAgent?.proxy?.protocol).toBe('https:');
  });
  it('createHttpProxyAgentWithHttpProxy', async function () {
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = await createProxyAgent('http://Server.com');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBe('http://192.168.1.1/');

    // @ts-ignore
    expect(proxyAgent?.defaultPort).toBe(80);

    // @ts-ignore
    expect(proxyAgent?.proxy?.protocol).toBe('http:');
  });
  it('createHttpProxyAgentWithHttpsProxy', async function () {
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('https://192.168.1.1');
    const proxyAgent = await createProxyAgent('http://Server.com');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBe('https://192.168.1.1/');

    // @ts-ignore
    expect(proxyAgent?.proxy?.protocol).toBe('https:');

    // @ts-ignore
    expect(proxyAgent?.defaultPort).toBe(80);
  });

  it('runs https proxy without proxy auth', async function () {
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('https://192.168.1.1');
    const proxyAgent = (await createProxyAgent('https://Server.com')) as HttpsProxyAgent;

    expect(proxyAgent.options.ca).toBeUndefined();

    // @ts-ignore
    expect(proxyAgent.proxy.username).toBe('');

    // @ts-ignore
    expect(proxyAgent.proxy.password).toBe('');

    expect(proxyAgent.options.cert).toBeUndefined();
    expect(proxyAgent.options.requestCert).toBeFalsy();
  });

  it('runs https proxy with ca', async function () {
    const TEST_FILE_PATH = process.cwd() + '/tests/resources/certs/example/example-cer.cer';
    const ca = [fs.readFileSync(TEST_FILE_PATH, 'utf-8')];

    preloadApi.setCaChainIdpInPreload(ca);

    //Mock the frontend answer which proxy server we have to use for our connection
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('https://192.168.1.1');

    const proxyAgent = (await createProxyAgent('https://Server.com')) as HttpsProxyAgent;

    expect(proxyAgent.options.ca).toBe(ca);
    // @ts-ignore
    expect(proxyAgent.proxy.username).toBe('');
    // @ts-ignore
    expect(proxyAgent.proxy.password).toBe('');
    expect(proxyAgent.options.cert).toBeUndefined();
    expect(proxyAgent.options.requestCert).toBe(false);
  });

  it('runs https proxy with basic auth', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: PROXY_AUTH_TYPES.BASIC_AUTH,
      [PROXY_SETTINGS_CONFIG.PROXY_USERNAME]: 'uname',
      [PROXY_SETTINGS_CONFIG.PROXY_PASSWORD]: 'pass',
    });

    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('https://192.168.1.1');
    const proxyAgent = (await createProxyAgent('http://Server.com')) as HttpsProxyAgent;

    expect(proxyAgent.options.ca).toBeUndefined();

    // @ts-ignore
    expect(proxyAgent.proxy.username).toBe('uname');
    // @ts-ignore
    expect(proxyAgent.proxy.password).toBe('pass');
    expect(proxyAgent.options.ca).toBeUndefined();
  });

  it('runs proxy with certificate auth', async function () {
    const TEST_FILE_PATH = process.cwd() + '/tests/resources/certs/example/example-cer.cer';

    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: PROXY_AUTH_TYPES.PROXY_CLIENT_CERT,
      [PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH]: TEST_FILE_PATH,
    });

    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('https://192.168.1.1');
    const proxyAgent = (await createProxyAgent('https://Server.com')) as HttpsProxyAgent;

    expect(proxyAgent.options.cert).toBe(fs.readFileSync(TEST_FILE_PATH, 'utf-8'));
    expect(proxyAgent.options.requestCert).toBe(true);
  });
  it('performs proxy creation with a matching proxyIgnoreList entry for the destination address', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: '213.95.83.120',
    });

    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = (await createProxyAgent(
      'https://idp-ref.app.ti-dienste.de/.well-known/openid-configuration',
    )) as HttpsProxyAgent;

    expect(proxyAgent).toBeUndefined();
  });

  it('performs proxy creation with a unmatching proxyIgnoreList entry for the destination address', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: '213.95.83.123',
    });

    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = (await createProxyAgent(
      'https://idp-ref.app.ti-dienste.de/.well-known/openid-configuration',
    )) as HttpsProxyAgent;

    expect(proxyAgent).toBeDefined();
  });

  it('performs proxy creation with a matching asterisk entry in the proxyIgnoreList for the destination address', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: '213.95.83.*',
    });

    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = (await createProxyAgent(
      'https://idp-ref.app.ti-dienste.de/.well-known/openid-configuration',
    )) as HttpsProxyAgent;

    expect(proxyAgent).toBeUndefined();
  });

  it('performs proxy creation with a matching CIDR entry in the proxyIgnoreList for the destination address', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: '213.95.83.0/24',
    });

    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = (await createProxyAgent(
      'https://idp-ref.app.ti-dienste.de/.well-known/openid-configuration',
    )) as HttpsProxyAgent;

    expect(proxyAgent).toBeUndefined();
  });
  it('performs proxy creation with a matching IP-List entry in the proxyIgnoreList for the destination address', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: '213.95.83.121;213.95.83.122;213.95.83.123;213.95.83.120',
    });
    jest.spyOn(ipcRenderer, 'sendSync').mockReturnValue('http://192.168.1.1');
    const proxyAgent = (await createProxyAgent(
      'https://idp-ref.app.ti-dienste.de/.well-known/openid-configuration',
    )) as HttpsProxyAgent;

    expect(proxyAgent).toBeUndefined();
  });
  it('useManualProxySetting', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_ADDRESS]: 'https://192.169.0.1',
      [PROXY_SETTINGS_CONFIG.PROXY_PORT]: '8888',
    });

    const proxyAgent = await createProxyAgent('https://Server.com');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBe('https://192.169.0.1:8888/');
  });

  it('should ignore basic fqdn', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_ADDRESS]: 'https://canbeanything.com',
      [PROXY_SETTINGS_CONFIG.PROXY_PORT]: '8888',
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: 'gematik.de',
    });

    const proxyAgent = await createProxyAgent('https://gematik.de');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBeUndefined();
  });

  it('should ignore fqdn with asterix', async function () {
    preloadApi.setAppConfigInPreload({
      ...SAMPLE_CONFIG_DATA,
      [PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS]: false,
      [PROXY_SETTINGS_CONFIG.PROXY_ADDRESS]: 'https://canbeanything.com',
      [PROXY_SETTINGS_CONFIG.PROXY_PORT]: '8888',
      [PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST]: '*.gematik.de',
    });

    const proxyAgent = await createProxyAgent('https://proxy.gematik.de');

    // @ts-ignore
    expect(proxyAgent?.proxy?.href).toBeUndefined();
  });
});
