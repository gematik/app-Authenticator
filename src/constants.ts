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

export const CONFIG_FILE_NAME = 'config.json';

export const ALLOWED_DEEPLINK_PROTOCOLS = ['tim'];

export const LOG_DIRECTORY_NAME = 'authenticator-logging';

/**
 * App's slug name
 * This will be used for to open the app with parameters from the browser or any other platform.
 */
export const CUSTOM_PROTOCOL_NAME = 'authenticator';

export const CREDENTIALS_MANAGER_SERVICE_NAME = 'Gematik_Authenticator';

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

export const IPC_READ_CREDENTIALS = 'IPC_READ_CREDENTIALS';
export const IPC_SAVE_CREDENTIALS = 'IPC_SAVE_CREDENTIALS';
/**
 * This sets the user agent in the main process
 */
export const IPC_SET_USER_AGENT = 'IPC_SET_USER_AGENT';

export const IPC_READ_CERTIFICATES = 'IPC_READ_CERTIFICATES';

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

export const WIKI_CONSENT_DECLARATION_URL = 'https://wiki.gematik.de/x/GijaI';

export const WIKI_CONFIGURATION_LINK =
  'https://wiki.gematik.de/display/GAKB/Installationshandbuch+Authenticator#InstallationshandbuchAuthenticator-Konfiguration:~:text=komplett%20zu%20beenden.-,Konfiguration,-Es%20gibt%20mehrere';

export const WIKI_INSTALLATION_SCENARIOS = 'https://wiki.gematik.de/pages/viewpage.action?pageId=492836624';

/**
 * URL zum Authenticator-Sharepoint
 */
export const SHAREPOINT_URL =
  'https://gematikde.sharepoint.com/:f:/s/EXTAuthenticator/Eufh1_mbmhhImVH1ZDhgKOwBZogXt6S9PxgT7WkAY20tkA?e=1S8IR5';
/**
 * URL zur Authenticator GitHub Release Übersicht
 */
export const GITHUB_URL = 'https://github.com/gematik/app-Authenticator/releases';
/**
 * URL zum Installationshandbuch des Authenticators
 */
export const MANUAL_URL = 'https://wiki.gematik.de/x/UTlCH';
/**
 * URL zum Authenticator-Fachportal
 */
export const FACHPORTAL_URL =
  'https://fachportal.gematik.de/hersteller-anbieter/komponenten-dienste/authenticator#c6684';
/**
 * URL zum Authenticator Voraussetzungs- und Kriterienkatalog
 */
export const CRITERIA_CATALOGUE_URL = 'https://wiki.gematik.de/x/FpTRHQ';
/**
 *
 */
export const CA_CONNECTOR_DIR_PATH = 'certs-konnektor';
/**
 * Der Sub-Ordner mit CAs für IDP bei TLS-Verbindung
 */
export const CA_IDP_DIR_PATH = 'certs-idp';

/**
 * On the renderer side, we have only the allowed environment variables,
 * to use more environment variables; you need to add them to the EXPOSED_ENV_VARIABLES list
 */
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
 * @deprecated IS_DEV only cen be used with MOCK_MODE == 'ENABLED' check
 */
export const IS_DEV = process.env.NODE_ENV === 'test' || PROCESS_ENVS.NODE_ENV === 'development';

/**
 * check if env is dev
 * @deprecated IS_TEST only cen be used with MOCK_MODE == 'ENABLED' check
 */
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

export const DEV_CON_CA_CERT_PATH = '/src/assets/certs-konnektor/ru';
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

export const STORAGE_CONFIG_KEYS = {
  HBA_CARD_USER_ID: 'userIdForCard-',
  SAVED_USER_CONSENT_PAIRS: 'savedUserConsentPairs',
  MIGRATIONS: {
    CREDENTIAL_MANAGER_STANDALONE: 'migrateCredentialManagerForStandalone',
  },
};

export const MACOS_PATHS = {
  LOGGING_DIR: '/Library/Logs/', // we add the user's home path at the beginning of this path e.x. /Users/x/Library...
  CERTS_DIR: window?.api?.homedir() + '/Library/Application Support/' + PRODUCT_NAME,
};

/**
 * We close the app if any debugging flags are found in the main process
 */
export const START_ARGUMENTS_TO_PREVENT = [
  '--remote-debugging-port',
  '--inspect',
  '--inspect-brk',
  '--inspect-port',
  '--remote-allow-origins',
];

export const TEST_CASES_JSON_FILE_NAME = 'test-cases-config.json';

// These are the environment variables that are exposed to the renderer process
export const EXPOSED_ENV_VARIABLES = [
  'VERSION',
  'BRANCH_NAME',
  'TAG_NAME',
  'BUILD_NUMBER',
  'CONNECTOR_PATH',
  'COMPUTERNAME',
  'CLIENTNAME',
  'VIEWCLIENT_MACHINE_NAME',
  'ViewClient_Machine_Name',
  'AUTHCONFIGPATH',
  'NODE_ENV',
  'MOCK_MODE',
];

/**
 * Allowed ciphers for the IDP
 */
export const IDP_CIPHERS = [
  'ECDHE-RSA-AES128-SHA256',
  'ECDHE-RSA-AES256-SHA384',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-SHA256',
  'ECDHE-ECDSA-AES256-SHA384',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-CCM',
  'ECDHE-ECDSA-AES256-CCM',
];

export enum CERTIFICATE_VALIDATION_STATUS {
  VALID = 'valid',
  INVALID = 'invalid',
  NOT_VALID_YET = 'not-valid-yet',
  EXPIRED = 'expired',
}
