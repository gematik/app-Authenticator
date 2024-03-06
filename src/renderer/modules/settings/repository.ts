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

import dot from 'dot-object';
import Swal from 'sweetalert2';

// #!if MOCK_MODE === 'ENABLED'
import { DEVELOPER_OPTIONS, MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
// #!endif
import {
  APP_NAME,
  CONFIG_FILE_NAME,
  IPC_GET_PATH,
  IPC_READ_CREDENTIALS,
  IPC_SAVE_CREDENTIALS,
  PROCESS_ENVS,
  PRODUCT_NAME,
} from '@/constants';
import { logger } from '@/renderer/service/logger';
import {
  CHECK_UPDATES_AUTOMATICALLY_CONFIG,
  ENTRY_OPTIONS_CONFIG_GROUP,
  PROXY_SETTINGS_CONFIG,
  SENSITIVE_CONFIG_KEYS_LIST,
  TLS_AUTH_TYPE_CONFIG,
} from '@/config';
import { TlsAuthType } from '@/@types/common-types';
import { ERROR_CODES } from '@/error-codes';
import { UserfacingError } from '@/renderer/errors/errors';
import i18n from '@/renderer/i18n';

export interface TRepositoryData {
  [key: string]: number | string | boolean;
}

/**
 * Holds data in the cache to prevent reading the config file frequently
 */
let storedData: TRepositoryData = {};

export interface ISettingsRepository {
  save(data: TRepositoryData): void;

  load(forceReload?: boolean): TRepositoryData;

  clear(): void;

  exist(): boolean;

  /**
   * This only updates the cached config and does not change the config.json
   * This is relevant for making function tests on the fly
   */
  setWithoutSave(data: TRepositoryData): void;
}

export const INITIAL_STATE = {
  [CHECK_UPDATES_AUTOMATICALLY_CONFIG]: true,
  [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
  [PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS]: true,
  [ENTRY_OPTIONS_CONFIG_GROUP.TLS_REJECT_UNAUTHORIZED]: false,
  [TLS_AUTH_TYPE_CONFIG]: TlsAuthType.ServerCertAuth,

  // #!if MOCK_MODE === 'ENABLED'
  [MOCK_CONNECTOR_CONFIG]: false,
  [DEVELOPER_OPTIONS.IDP_CERTIFICATE_CHECK]: true,
  // #!endif
};

export class FileStorageRepository implements ISettingsRepository {
  static get isNewInstallation(): boolean {
    return this._isNewInstallation;
  }
  static set isNewInstallation(value: boolean) {
    this._isNewInstallation = value;
  }

  static get usesCredentialManager(): boolean {
    return this._usesCredentialManager;
  }

  static set usesCredentialManager(value: boolean) {
    this._usesCredentialManager = value;
  }

  static get isJsonFileInvalid(): boolean {
    return this._isJsonFileInvalid;
  }

  static set isJsonFileInvalid(value: boolean) {
    this._isJsonFileInvalid = value;
  }

  private static encoding: BufferEncoding = 'utf-8';
  private static _path: string | null = null;
  private static _usesCredentialManager = false;
  private static _isNewInstallation = false;
  private static _isJsonFileInvalid = false;

  public static getConfigDir(): { path: string; localEnv: boolean } {
    const clientName = PROCESS_ENVS.CLIENTNAME;
    const computerName = PROCESS_ENVS.COMPUTERNAME;
    const authConfigPath = PROCESS_ENVS.AUTHCONFIGPATH;
    const viewClientMachineName = PROCESS_ENVS.VIEWCLIENT_MACHINE_NAME || PROCESS_ENVS.ViewClient_Machine_Name;

    logger.info('configPath:');
    logger.info('  -  AUTHCONFIGPATH:' + authConfigPath);
    logger.info('  -  CLIENTNAME:' + clientName);
    logger.info('  -  COMPUTERNAME:' + computerName);
    logger.info('  -  VIEWCLIENT_MACHINE_NAME:' + viewClientMachineName);

    // Abhängig von folgenden Umgebungsvariablen wird die Lokalität der zu verwendenden config.json in folgender Reihenfolge bestimmt:
    // 1. Wenn die Umgebungsvariable AUTHCONFIGPATH gesetzt ist und die Umgebungsvariable ViewClient_Machine_Name (VMWARE)
    //    → config.json im Folder: AUTHCONFIGPATH + //ViewClient_Machine_Name//config.json
    // 2. Wenn die Umgebungsvariable AUTHCONFIGPATH gesetzt ist und die Umgebungsvariable CLIENTNAME (CITRIX)
    //    → config.json im Folder: AUTHCONFIGPATH + //CLIENTNAME//config.json
    // 3. Wenn die Umgebungsvariable AUTHCONFIGPATH gesetzt ist und die Umgebungsvariable COMPUTERNAME
    //    → config.json im Folder: AUTHCONFIGPATH + //COMPUTERNAME//config.json
    // 4. Für alle anderen Fälle (auch im Fehlerfall das der AUTHCONFIGPATH nicht existiert!):
    //    → config.json im Installationsverzeichnis der exe (wie bisher)

    //wenn keine config.json in dem viewClientMachineName, clientName oder computerName Pfad existiert, dann wird die lokale config benutzt
    let configPath = '';
    if (authConfigPath) {
      if (viewClientMachineName) {
        logger.info(' - config über ViewClient_Machine_Name');
        configPath = window.api.pathJoin(authConfigPath.toString(), viewClientMachineName.toString());
      } else if (clientName) {
        logger.info(' - config über CLIENTNAME');
        configPath = window.api.pathJoin(authConfigPath.toString(), clientName.toString());
      } else if (computerName) {
        logger.info(' - config über COMPUTERNAME');
        configPath = window.api.pathJoin(authConfigPath.toString(), computerName.toString());
      }
      return { path: configPath, localEnv: false };
    }

    logger.info(' - config über Anwendungsverzeichnis');
    return { path: window.api.sendSync(IPC_GET_PATH, 'userData') as string, localEnv: true };
  }

  public static getPath(): string {
    if (FileStorageRepository._path) {
      return FileStorageRepository._path;
    }

    const config = FileStorageRepository.getConfigDir();
    let path = config.path;
    if (config.localEnv) {
      path = path.replace('Roaming', 'Local');

      //C:\Users\USERNAME\AppData\Local\authenticator -> C:\Users\USERNAME\AppData\Local\gematik Authenticator
      path = path.replace(window.api.pathSep() + APP_NAME, window.api.pathSep() + PRODUCT_NAME);

      if (!window.api.existsSync(path)) {
        try {
          window.api.mkdirSync(path);
        } catch (err) {
          logger.error('Config dir could not be created', err.message);
        }
      }
    }

    path += window.api.pathJoin('/', CONFIG_FILE_NAME);

    FileStorageRepository._path = path;

    logger.info(' - config.json path: ' + path);
    return path;
  }

  save(data: TRepositoryData): void {
    // update state
    storedData = dot.dot(data);

    // send data to preload & main
    window.api.setAppConfigInPreload(storedData);

    const { shouldSaveToCM, showWarningOnFail, saveAllToConfigFileOnFail } = FileStorageRepository.decideToSaveToCM();
    const nonSensitiveData = FileStorageRepository.filterSensitiveData(data);
    let dataToSaveConfigFile: TRepositoryData = saveAllToConfigFileOnFail ? data : nonSensitiveData;

    // save to credential manager
    if (shouldSaveToCM) {
      const savedToCMSuccessfully = FileStorageRepository.saveToCm(data);

      if (!savedToCMSuccessfully && showWarningOnFail) {
        throw new UserfacingError('Could not save to credential manager', '', ERROR_CODES.AUTHCL_0010);
      }

      if (savedToCMSuccessfully) {
        dataToSaveConfigFile = nonSensitiveData;
      }
    } else {
      dataToSaveConfigFile = data;
    }

    const unFlatted = dot.object({ ...dataToSaveConfigFile });
    window.api.writeFileSync(FileStorageRepository.getPath(), JSON.stringify(unFlatted, null, 2));

    logger.info('Saved config changes under: ', FileStorageRepository.getPath());

    // #!if MOCK_MODE === 'ENABLED'
    FileStorageRepository.printConfig();
    // #!endif
  }

  static saveToCm(data?: TRepositoryData): boolean {
    return window.api.sendSync(IPC_SAVE_CREDENTIALS, data) as boolean;
  }

  static readFromCm(): Partial<TRepositoryData> {
    return (window.api.sendSync(IPC_READ_CREDENTIALS) as Partial<TRepositoryData>) || {};
  }

  static decideToSaveToCM(): {
    shouldSaveToCM: boolean;
    showWarningOnFail: boolean;
    saveAllToConfigFileOnFail: boolean;
  } {
    let shouldSaveToCM;
    let showWarningOnFail;
    let saveAllToConfigFileOnFail;

    const isCentralConfiguration = PROCESS_ENVS.AUTHCONFIGPATH;

    // If it's a new installation
    if (FileStorageRepository._isNewInstallation) {
      shouldSaveToCM = true;
      showWarningOnFail = true;
      saveAllToConfigFileOnFail = false;
    } else {
      if (isCentralConfiguration) {
        if (FileStorageRepository._usesCredentialManager) {
          shouldSaveToCM = true;
          saveAllToConfigFileOnFail = false;
          showWarningOnFail = true;
        } else {
          shouldSaveToCM = false;
          saveAllToConfigFileOnFail = true;
          showWarningOnFail = true;
        }
      } else {
        saveAllToConfigFileOnFail = false;
        showWarningOnFail = true;
        shouldSaveToCM = true;
      }
    }

    return { shouldSaveToCM, showWarningOnFail, saveAllToConfigFileOnFail };
  }
  /**
   * This function filters sensitive data from the config data
   * @param data
   */
  static filterSensitiveData(data: TRepositoryData): TRepositoryData {
    const nonSensitiveData: TRepositoryData = {};

    for (const key in data) {
      if (!SENSITIVE_CONFIG_KEYS_LIST.includes(key)) {
        nonSensitiveData[key] = data[key];
      }
    }

    return nonSensitiveData;
  }

  /**
   * todo be sure that config file exists, and has a right format. If not, throw error
   */
  load(forceReload = false): TRepositoryData {
    if (!forceReload && Object.keys(storedData).length) {
      return storedData;
    }

    // forceReload happens when env vars get changed;
    // that means we need to recalculate the path
    if (forceReload) {
      FileStorageRepository._path = null;
    }

    const sensitiveDataFromCredentialsManager = FileStorageRepository.readFromCm();

    // set usesCredentialManager if sensitiveDataFromCredentialsManager is not empty
    FileStorageRepository._usesCredentialManager = !!Object.keys(sensitiveDataFromCredentialsManager).length;

    if (!window.api.existsSync(FileStorageRepository.getPath())) {
      FileStorageRepository._isNewInstallation = true;
      return { ...INITIAL_STATE };
    }

    const buffer = window.api.readFileSync(FileStorageRepository.getPath(), FileStorageRepository.encoding);
    const string = buffer.toString();

    let json: TRepositoryData;

    try {
      // convert string to json and convert string booleans to booleans
      json = JSON.parse(string, (_, value) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
      });
      FileStorageRepository._isJsonFileInvalid = false;
    } catch (e) {
      logger.error('Error while parsing config file', e);
      FileStorageRepository._isJsonFileInvalid = true;

      Swal.fire({
        icon: 'error',
        title: i18n.global.t(`errors.${ERROR_CODES.AUTHCL_0012}.title`),
        text: i18n.global.t(`errors.${ERROR_CODES.AUTHCL_0012}.text`, { path: FileStorageRepository.getPath() }),
      });

      return {};
    }

    const dottedData = {
      ...dot.dot(json),
      // get sensitive data from credential manager
      ...sensitiveDataFromCredentialsManager,
    };

    const data = {
      ...INITIAL_STATE,
      ...dottedData,
    };
    storedData = data;

    // send data to preload & main
    window.api.setAppConfigInPreload(storedData);
    // #!if MOCK_MODE === 'ENABLED'
    FileStorageRepository.printConfig();
    // #!endif
    return data;
  }

  clear(): void {
    storedData = {};

    if (window.api.existsSync(FileStorageRepository.getPath())) {
      window.api.unlinkSync(FileStorageRepository.getPath());
    }
  }

  exist(): boolean {
    return window.api.existsSync(FileStorageRepository.getPath());
  }

  /**
   * This only updates the cached config and does not change the config.json
   * @param data
   */
  setWithoutSave(data: TRepositoryData): void {
    storedData = data;
  }

  // #!if MOCK_MODE === 'ENABLED'
  private static printConfig() {
    logger.info('print settings:');
    for (const item in storedData) {
      if (!item.toLowerCase().includes('password')) {
        logger.info('  - ' + item + ':' + storedData[item]);
      }
    }
  }

  // #!endif
}
