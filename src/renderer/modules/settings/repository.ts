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
import { APP_NAME, CONFIG_FILE_NAME, IPC_GET_PATH, PROCESS_ENVS, PRODUCT_NAME } from '@/constants';
import { logger } from '@/renderer/service/logger';
import {
  CHECK_UPDATES_AUTOMATICALLY_CONFIG,
  ENTRY_OPTIONS_CONFIG_GROUP,
  PROXY_SETTINGS_CONFIG,
  TLS_AUTH_TYPE_CONFIG,
} from '@/config';
import { TlsAuthType } from '@/@types/common-types';
import { MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';

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

  /* @if MOCK_MODE == 'ENABLED' */
  [MOCK_CONNECTOR_CONFIG]: false,
  /* @endif */
};

export class FileStorageRepository implements ISettingsRepository {
  private static encoding: BufferEncoding = 'utf-8';
  private static _path: string | null = null;

  public static getConfigDir(): { path: string; localEnv: boolean } {
    const clientName = PROCESS_ENVS.CLIENTNAME;
    const computerName = PROCESS_ENVS.COMPUTERNAME;
    const authConfigPath = PROCESS_ENVS.AUTHCONFIGPATH;
    const viewClientMachineName = PROCESS_ENVS.VIEWCLIENT_MACHINE_NAME;

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
    //    → config.json im Installationsverzeichnis der exe ( wie bisher )

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
      const testPath = window.api.pathJoin(configPath, '/', CONFIG_FILE_NAME);
      if (window.api.existsSync(testPath) && window.api.isFile(testPath)) {
        return { path: configPath, localEnv: false };
      }

      logger.info(' - config Pfad nicht valide!');
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

    logger.info(' - config.json path:' + path);
    return path;
  }

  save(data: TRepositoryData): void {
    // update state
    storedData = dot.dot(data);

    // send data to preload & main
    window.api.setAppConfigInPreload(storedData);
    const unFlatted = dot.object({ ...data });
    /* @if MOCK_MODE == 'ENABLED' */
    FileStorageRepository.printConfig();
    /* @endif */
    return window.api.writeFileSync(FileStorageRepository.getPath(), JSON.stringify(unFlatted));
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

    if (!window.api.existsSync(FileStorageRepository.getPath())) {
      return { ...INITIAL_STATE };
    }

    const buffer = window.api.readFileSync(FileStorageRepository.getPath(), FileStorageRepository.encoding);
    const string = buffer.toString();

    // convert string to json and convert string booleans to booleans
    const json = JSON.parse(string, (key, value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    });

    const data = {
      ...INITIAL_STATE,
      ...dot.dot(json),
    };
    storedData = data;

    // send data to preload & main
    window.api.setAppConfigInPreload(storedData);
    /* @if MOCK_MODE == 'ENABLED' */
    FileStorageRepository.printConfig();
    /* @endif */
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

  /* @if MOCK_MODE == 'ENABLED' */
  private static printConfig() {
    logger.info('print settings:');
    for (const item in storedData) {
      if (!item.toLowerCase().includes('password')) {
        logger.info('  - ' + item + ':' + storedData[item]);
      }
    }
  }

  /* @endif */
}
