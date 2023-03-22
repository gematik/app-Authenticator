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
  AUTH_TYPE: 'proxy.proxySettingsType',
  PROXY_USERNAME: 'proxy.proxySettingsUsername',
  PROXY_PASSWORD: 'proxy.proxySettingsPassword',
  PROXY_CERTIFICATE_PATH: 'proxy.proxySettingsCertificatePath',
  PROXY_IGNORE_LIST: 'proxy.proxyIgnoreList',
};

export enum PROXY_AUTH_TYPES {
  BASIC_AUTH = 'BasicAuth',
  PROXY_CLIENT_CERT = 'ProxyClientCert',
}
