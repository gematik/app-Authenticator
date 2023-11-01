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

export const CONFIG_FILE_NAME = 'config.json';

export const ALLOWED_DEEPLINK_PROTOCOLS = ['tim'];

/**
 * App's slug name
 * This will be used for to open the app with parameters from the browser or any other platform.
 */
export const CUSTOM_PROTOCOL_NAME = 'authenticator';

/**
 * Additional Information in the request header user-agent to the idp
 */
export const USERAGENT_PRODUKTNAME = 'authenticator';
export const USERAGENT_HERSTELLERNAME = 'gematik';

export const IPC_READ_MAIN_PROCESS_ENVS = 'IPC_READ_MAIN_PROCESS_ENVS';

export const IPC_UPDATE_ENV = 'IPC_UPDATE_ENV';

export const IPC_SELECT_FOLDER = 'IPC_SELECT_FOLDER';

/**
 * The event listener name for starting authentication process
 */
export const IPC_START_AUTH_FLOW_EVENT = 'IPC_START_AUTH_FLOW_EVENT';

/**
 * Event name for redirecting the http request
 */
export const IPC_GET_PATH = 'IPC_GET_PATH';

/**
 * This sets the user agent in the main process
 */
export const IPC_SET_USER_AGENT = 'IPC_SET_USER_AGENT';

/**
 * @deprecated remove this logic completely and use cardType parameter instead
 */
export const SCOPE_ADDITION_HBA = ' Person_ID';

/**
 * @deprecated remove this logic completely and use cardType parameter instead
 */
export const SCOPE_ADDITION_SMCB = ' Institutions_ID';

export const IPC_GET_APP_PATH = 'IPC_GET_APP_PATH';

export const IPC_GET_PROXY = 'IPC_GET_PROXY';

export const IPC_WARN_USER = 'IPC_WARN_USER';

/**
 * Start check a new update process
 */
export const IPC_CHECK_UPDATE = 'IPC_CHECK_UPDATE';
export const IPC_CANCEL_UPDATE = 'IPC_CANCEL_UPDATE';

/**
 * Event name for  maximizing and focusing to authenticator app
 */
export const IPC_FOCUS_TO_AUTHENTICATOR = 'IPC_FOCUS_TO_AUTHENTICATOR';

/**
 * Event name for  minimizing the authenticator app
 */
export const IPC_MINIMIZE_THE_AUTHENTICATOR = 'IPC_MINIMIZE_THE_AUTHENTICATOR';

/**
 * Our logging system works in the main task, not in the browser.
 * That's why we use ipc bridge and those events to send logs to file
 */
export const IPC_ERROR_LOG_EVENT_TYPES = {
  ERROR: 'IPC_ERROR_LOG_EVENT_TYPES_ERROR',
  DEBUG: 'IPC_ERROR_LOG_EVENT_TYPES_DEBUG',
  WARN: 'IPC_ERROR_LOG_EVENT_TYPES_WARN',
  INFO: 'IPC_ERROR_LOG_EVENT_TYPES_INFO',
};

/**
 * Common used regex list for javascript,
 * we use these to validate deeplink parameters and input
 */
export const COMMON_USED_REGEXES = {
  ANYTHING: /[^]*/,
  BOOLEAN_AS_TEXT: /true|false/,
  LETTERS_NUMBERS: /^[a-z0-9-_.+/=]+$/i,
  CODE: /[a-z][a-z]\w*\w\w/i,
  NUMBER: /^\d+$/,
  BASE64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i,
  URL: /(http|https):\/\/(\w+:?\w*@)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/,
  JWT: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
  CONNECTOR_ALLOWED: /^((?![<>&]).)*$/,
};

/**
 * Ordnername nach Setup / Name der .exe / Ordnername der Config-File mit CAs
 */
export const PRODUCT_NAME = 'gematik Authenticator';

/**
 * Name der App
 */
export const APP_NAME = 'authenticator';
/**
 * URL zu den Authenticator-Fehlercodes (Komplettübersicht)
 */
export const WIKI_ERRORCODES_URL = 'https://wiki.gematik.de/x/-A3OGw';
/**
 * URL zum Authenticator-Sharepoint
 */
export const SharePoint_URL =
  'https://gematikde.sharepoint.com/:f:/s/EXTAuthenticator/Eufh1_mbmhhImVH1ZDhgKOwBZogXt6S9PxgT7WkAY20tkA?e=1S8IR5';
/**
 * URL zum Authenticator-Fachportal
 */
export const Fachportal_URL =
  'https://fachportal.gematik.de/hersteller-anbieter/komponenten-dienste/authenticator#c6684';
/**
 *
 */
export const CA_CONNECTOR_DIR_PATH = 'certs-konnektor';
/**
 * Der Sub-Ordner mit CAs für IDP bei TLS-Verbindung
 */
export const CA_IDP_DIR_PATH = 'certs-idp';

export let PROCESS_ENVS: Record<string, unknown> = window?.api?.sendSync
  ? JSON.parse(window.api.sendSync(IPC_READ_MAIN_PROCESS_ENVS) as string)
  : (process.env as Record<string, unknown>);

/**
 * First re-read process envs
 */
export const updateProcessEnvs = () => {
  PROCESS_ENVS = JSON.parse(window?.api?.sendSync(IPC_READ_MAIN_PROCESS_ENVS) as string);
};

/**
 * check if env is dev
 */
export const IS_DEV = process.env.NODE_ENV === 'test' || PROCESS_ENVS.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

/**
 * Error or success message duration in the end of the auth process
 */
export const SHOW_DIALOG_DURATION = 2000;

/**
 * Retry timeout duration for auth flow
 */
export const AUTH_RE_TRY_TIMEOUT = 5000;

export const IDP_ENDPOINTS = {
  OPENID_CONFIGURATION: '/.well-known/openid-configuration',
};

export const LOGIN_VIA_SMART_CARD_SUCCESSFUL = 'login_via_smart_card_successful';

export const LOGIN_NOT_SUCCESSFUL = 'login_not_successful';

export const LOGIN_CANCELLED_BY_USER = 'login_cancelled_by_user';

export const DEV_CON_CA_CERT_PATH = '/src/assets/certs-konnektor/ca/pu/rsa';
export const DEV_IDP_CA_CERT_PATH = '/src/assets/certs-idp';

export enum P12_VALIDITY_TYPE {
  'VALID',
  'INVALID_CERTIFICATE',
  'WRONG_PASSWORD',
  'NO_CERT_FOUND',
  'ONE_VALID_AND_INVALID_CERTIFICATES',
  'TOO_MANY_CERTIFICATES',
  'PROCESSING_EXCEPTION',
}

export const STORAGE_CONFIG_KEYS = { HBA_CARD_USER_ID: 'userIdForCard-' };
