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
import { CHECK_UPDATES_AUTOMATICALLY_CONFIG, PROXY_SETTINGS_CONFIG } from '@/config';

export interface TRepositoryData {
  [key: string]: number | string | boolean;
}

/**
 * Holds data in the cache to prevent reading the config file frequently
 */
let storedData: TRepositoryData = {};

export interface ISettingsRepository {
  save(data: TRepositoryData): void;

  load(): TRepositoryData;

  clear(): void;

  exist(): boolean;
}

const INITIAL_STATE = {
  [CHECK_UPDATES_AUTOMATICALLY_CONFIG]: true,
  [PROXY_SETTINGS_CONFIG.AUTH_TYPE]: false,
};

export class FileStorageRepository implements ISettingsRepository {
  private static encoding: BufferEncoding = 'utf-8';
  private static _path: string | null = null;

  public static getConfigPath(): string {
    const clientName = PROCESS_ENVS.CLIENTNAME;
    const computerName = PROCESS_ENVS.COMPUTERNAME;
    const authConfigPath = PROCESS_ENVS.AUTHCONFIGPATH;

    logger.info('configPath:');
    logger.info('  -  AUTHCONFIGPATH:' + authConfigPath);
    logger.info('  -  CLIENTNAME:' + clientName);
    logger.info('  -  COMPUTERNAME:' + computerName);

    // Abhängig von folgenden Umgebungsvariablen wird die Lokalität der zu verwendenden config.json in folgender Reihenfolge bestimmt:
    // 1. Wenn die Umgebungsvariable AUTHCONFIGPATH gesetzt ist und die Umgebungsvariable CLIENTNAME
    //    => config.json im Folder: AUTHCONFIGPATH + //CLIENTNAME//config.json
    // 2. Wenn die Umgebungsvariable AUTHCONFIGPATH gesetzt ist und die Umgebungsvariable COMPUTERNAME
    //    => config.json im Folder: AUTHCONFIGPATH + //COMPUTERNAME//config.json
    // 3. Für alle anderen Fälle :
    //    => config.json im Installationsverzeichnis der exe ( wie bisher )

    if (authConfigPath) {
      if (clientName) {
        logger.info(' - config über CLIENTNAME');
        return window.api.pathJoin(authConfigPath.toString(), clientName.toString());
      } else {
        if (computerName) {
          logger.info(' - config über COMPUTERNAME');
          return window.api.pathJoin(authConfigPath.toString(), computerName.toString());
        }
      }
    }

    logger.info(' - config über Anwendungsverzeichnis');
    return window.api.sendSync(IPC_GET_PATH, 'userData') as string;
  }

  private static path(): string {
    if (FileStorageRepository._path) {
      return FileStorageRepository._path;
    }

    let path = FileStorageRepository.getConfigPath();

    if (!PROCESS_ENVS.AUTHCONFIGPATH) {
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
    return window.api.writeFileSync(FileStorageRepository.path(), JSON.stringify(unFlatted));
  }

  load(): TRepositoryData {
    if (Object.keys(storedData).length) {
      return storedData;
    }

    if (!window.api.existsSync(FileStorageRepository.path())) {
      return INITIAL_STATE;
    }

    const buffer = window.api.readFileSync(FileStorageRepository.path(), FileStorageRepository.encoding);
    const string = buffer.toString();
    const json = JSON.parse(string);

    const data = dot.dot(json);
    storedData = data;

    // send data to preload & main
    window.api.setAppConfigInPreload(storedData);

    return data;
  }

  clear(): void {
    storedData = {};

    if (window.api.existsSync(FileStorageRepository.path())) {
      window.api.unlinkSync(FileStorageRepository.path());
    }
  }

  exist(): boolean {
    return window.api.existsSync(FileStorageRepository.path());
  }
}
