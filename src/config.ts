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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { CREDENTIALS_MANAGER_SERVICE_NAME } from '@/constants';

export const CONTEXT_PARAMETERS_CONFIG_GROUP = {
  MANDANT_ID: 'connector.contextParameter.mandantId',
  CLIENT_ID: 'connector.contextParameter.clientId',
  WORKPLACE_ID: 'connector.contextParameter.workplaceId',
} as const;

export const ENTRY_OPTIONS_CONFIG_GROUP = {
  HOSTNAME: 'connector.entryOption.hostname',
  /**
   * @deprecated We will use the HOSTNAME config instead, in the future we will remove this config
   * when we are sure that all customers have migrated to the new config
   */
  PORT: 'connector.entryOption.port',
  TLS_REJECT_UNAUTHORIZED: 'connector.entryOption.tlsRejectUnauthorized',
  TLS_PRIVATE_KEY: 'connector.entryOption.keyFile',
  TLS_CERTIFICATE: 'connector.entryOption.certFile',
  TLS_PFX_CERTIFICATE: 'connector.entryOption.pfxFile',
  TLS_PFX_PASSWORD: 'connector.entryOption.pfxPassword',
  USERNAME_BASIC_AUTH: 'connector.entryOption.username',
  PASSWORD_BASIC_AUTH: 'connector.entryOption.password',
  SMCB_PIN_OPTION: 'connector.entryOption.smcbPinOption',
} as const;

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

export const CONNECTOR_GATEWAY_NAME = 'connectorGatewayName';
export const CONNECTOR_GATEWAY_NAME_STATUS = 'connectorGatewayNameStatus';

export const PROXY_SETTINGS_CONFIG = {
  USE_OS_SETTINGS: 'proxy.useOsSettings',
  USE_FOR_CONNECTOR: 'proxy.useForConnector',
  AUTH_TYPE: 'proxy.proxySettingsType',
  PROXY_USERNAME: 'proxy.proxySettingsUsername',
  PROXY_PASSWORD: 'proxy.proxySettingsPassword',
  PROXY_CERTIFICATE_PATH: 'proxy.proxySettingsCertificatePath',
  PROXY_IGNORE_LIST: 'proxy.proxyIgnoreList',
  PROXY_ADDRESS: 'proxy.proxySettingsAddress',
  PROXY_PORT: 'proxy.proxySettingsPort',
} as const;

export const TIMEOUT_PARAMETER_CONFIG = 'timeoutValue';

export const ECC_WARNING_OPTIONS = {
  ECC_WARNING_STATUS: 'eccWarnings.status',
  ECC_WARNING_START_DATE: 'eccWarnings.startDate',
  CUSTOM_MESSAGE: 'eccWarnings.customMessage',
} as const;

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
