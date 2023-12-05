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

import { CREDENTIALS_MANAGER_SERVICE_NAME } from '@/constants';

export const CONTEXT_PARAMETERS_CONFIG_GROUP = {
  MANDANT_ID: 'connector.contextParameter.mandantId',
  CLIENT_ID: 'connector.contextParameter.clientId',
  WORKPLACE_ID: 'connector.contextParameter.workplaceId',
};

export const ENTRY_OPTIONS_CONFIG_GROUP = {
  HOSTNAME: 'connector.entryOption.hostname',
  PORT: 'connector.entryOption.port',
  TLS_REJECT_UNAUTHORIZED: 'connector.entryOption.tlsRejectUnauthorized',
  TLS_PRIVATE_KEY: 'connector.entryOption.keyFile',
  TLS_CERTIFICATE: 'connector.entryOption.certFile',
  TLS_PFX_CERTIFICATE: 'connector.entryOption.pfxFile',
  TLS_PFX_PASSWORD: 'connector.entryOption.pfxPassword',
  USERNAME_BASIC_AUTH: 'connector.entryOption.username',
  PASSWORD_BASIC_AUTH: 'connector.entryOption.password',
};

/**
 * @deprecated
 */
export const AUTH_SIGN_PARAMETER_CONFIG_GROUP = {
  SIGNATURE_TYPE: 'connector.authSignParameter.signatureType',
  SIGNATURE_SCHEMES: 'connector.authSignParameter.signatureSchemes',
};

export const TLS_AUTH_TYPE_CONFIG = 'connector.tlsAuthType';

/**
 * Whether check updates automatically or not
 */
export const CHECK_UPDATES_AUTOMATICALLY_CONFIG = 'checkUpdatesAutomatically';

export const PROXY_SETTINGS_CONFIG = {
  USE_OS_SETTINGS: 'proxy.useOsSettings',
  AUTH_TYPE: 'proxy.proxySettingsType',
  PROXY_USERNAME: 'proxy.proxySettingsUsername',
  PROXY_PASSWORD: 'proxy.proxySettingsPassword',
  PROXY_CERTIFICATE_PATH: 'proxy.proxySettingsCertificatePath',
  PROXY_IGNORE_LIST: 'proxy.proxyIgnoreList',
  PROXY_ADDRESS: 'proxy.proxySettingsAddress',
  PROXY_PORT: 'proxy.proxySettingsPort',
};

export enum PROXY_AUTH_TYPES {
  BASIC_AUTH = 'BasicAuth',
  PROXY_CLIENT_CERT = 'ProxyClientCert',
}

type TSensitiveConfigKeys = Record<string, { accountKey: string; passwordKey: string; ignoreAccountKey?: boolean }>;
export const SENSITIVE_CONFIG_KEYS: TSensitiveConfigKeys = {
  [CREDENTIALS_MANAGER_SERVICE_NAME + '/Connector_BasicAuth']: {
    accountKey: ENTRY_OPTIONS_CONFIG_GROUP.USERNAME_BASIC_AUTH,
    passwordKey: ENTRY_OPTIONS_CONFIG_GROUP.PASSWORD_BASIC_AUTH,
  },
  [CREDENTIALS_MANAGER_SERVICE_NAME + '/Connector_ClientCert_Password']: {
    accountKey: 'p12Password',
    passwordKey: ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD,
    // account key is hardcoded, we don't want to put it into the config, it will be only used for saving the password
    ignoreAccountKey: true,
  },
  [CREDENTIALS_MANAGER_SERVICE_NAME + '/Proxy_BasicAuth']: {
    accountKey: PROXY_SETTINGS_CONFIG.PROXY_USERNAME,
    passwordKey: PROXY_SETTINGS_CONFIG.PROXY_PASSWORD,
  },
};

/**
 * List of config keys, accountKey is ignored if  ignoreAccountKey is true
 */
export const SENSITIVE_CONFIG_KEYS_LIST = Object.values(SENSITIVE_CONFIG_KEYS)
  .map(({ accountKey, passwordKey, ignoreAccountKey }) => {
    return ignoreAccountKey ? [passwordKey] : [accountKey, passwordKey];
  })
  .flat();
