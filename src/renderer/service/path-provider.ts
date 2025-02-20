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

import {
  APP_NAME,
  CA_CONNECTOR_DIR_PATH,
  CA_IDP_DIR_PATH,
  DEV_CON_CA_CERT_PATH,
  DEV_IDP_CA_CERT_PATH,
  IPC_GET_APP_PATH,
  IPC_GET_PATH,
  // #!if MOCK_MODE === 'ENABLED'
  IS_DEV,
  // #!endif
  MACOS_PATHS,
  PRODUCT_NAME,
  TEST_CASES_JSON_FILE_NAME,
} from '@/constants';
import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';

export class PathProvider {
  private static appPath: string = (window.api.sendSync(IPC_GET_APP_PATH) as string) ?? 'undefined';
  private static systemUserTempPath: string = (window.api.sendSync(IPC_GET_PATH, 'temp') as string) ?? 'undefined';
  private static processCWD = window.api.getProcessCwd();
  private static _configPath = '';
  private static _macOsUserAppPath = '';

  /**
   * Returns config path
   * Same on dev and prod
   * @return String
   */
  static get configPath(): string {
    if (!this._configPath) {
      let mainPath = PathProvider.getSystemUserTempPath();
      const tempPath = PathProvider.getSystemUserTempPath().toLowerCase();
      const tempIndex = tempPath.indexOf('temp');
      if (tempIndex !== -1) {
        mainPath = tempPath.substring(0, tempIndex);
      }

      this._configPath = window.api.pathJoin(mainPath, PRODUCT_NAME);
    }
    return this._configPath;
  }

  static setAppPath(path: string): void {
    PathProvider.appPath = path;
  }

  public static getAppPath(): string {
    return PathProvider.appPath;
  }

  static setSystemUserTempPath(path: string): void {
    PathProvider.systemUserTempPath = path;
  }

  public static getSystemUserTempPath(): string {
    return PathProvider.systemUserTempPath;
  }

  public static getProcessCWD(): string {
    return PathProvider.processCWD;
  }

  /**
   * @Note Only for macOS, can be improved for windows too
   *
   * returns /Users/<user>/Library/Application Support/gematik Authenticator
   */
  public static getMacOsUserAppPath(): string {
    if (this._macOsUserAppPath) {
      return this._macOsUserAppPath;
    }

    const userData = <string>window.api.sendSync(IPC_GET_PATH, 'userData');

    // change the path from .../Application Support/authenticator to .../Application Support/gematik Authenticator
    return userData.replace(window.api.pathSep() + APP_NAME, window.api.pathSep() + PRODUCT_NAME);
  }

  public static caCertificatePath(isConnector: boolean): string {
    // #!if MOCK_MODE === 'ENABLED'
    if (IS_DEV) {
      const certsPath = isConnector ? DEV_CON_CA_CERT_PATH : DEV_IDP_CA_CERT_PATH;
      return window.api.pathJoin(PathProvider.getProcessCWD(), certsPath);
    }
    // #!endif

    if (window.api.isMacOS()) {
      const dirName = isConnector ? CA_CONNECTOR_DIR_PATH : CA_IDP_DIR_PATH;
      return window.api.pathJoin(MACOS_PATHS.CERTS_DIR, dirName);
    } else {
      const replaceValue = isConnector
        ? window.api.pathJoin(CA_CONNECTOR_DIR_PATH + window.api.pathSep())
        : window.api.pathJoin(CA_IDP_DIR_PATH + window.api.pathSep());

      const pattern = /app.asar/i;
      return PathProvider.getAppPath().replace(pattern, replaceValue);
    }
  }

  /**
   * Returns the path to the test cases json file
   */
  public static getTestCasesPath(): string {
    let filePath = '';

    if (window.api.isMacOS()) {
      filePath = window.api.pathJoin(PathProvider.getMacOsUserAppPath(), TEST_CASES_JSON_FILE_NAME);

      // #!if MOCK_MODE === 'ENABLED'
      if (IS_DEV) {
        filePath = window.api.pathJoin(PathProvider.getAppPath(), 'src/assets/', TEST_CASES_JSON_FILE_NAME);
      }
      // #!endif
    } else {
      // TODO: This config file must be stored on a proper location and not in the dist folder
      // C:\Program Files\gematik Authenticator\resources
      filePath = window.api.pathJoin(PathProvider.getAppPath().replace(/app.asar/i, ''), TEST_CASES_JSON_FILE_NAME);
    }

    if (!window.api.existsSync(filePath)) {
      logger.error('Config file not found: ' + filePath + '-App-path: ' + PathProvider.getAppPath());
      throw new UserfacingError('Read Config File', 'file ' + filePath + ' not found', undefined, {
        filePath,
      });
    }

    return filePath;
  }
}
