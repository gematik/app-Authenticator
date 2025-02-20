/*
 * Copyright 2024 gematik GmbH
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

import os from 'os';
import { app } from 'electron';
import { LOG_DIRECTORY_NAME, MACOS_PATHS } from '@/constants';
import { isMacOS } from '@/main/services/utils';
import path from 'path';
import fs from 'fs';
import { getUniqueDateString } from '@/main/services/logging';

export class MainPathProvider {
  private static _logDirectoryPath = '';

  public static get logDirectoryPath(): string {
    if (!this._logDirectoryPath) {
      this._logDirectoryPath = MainPathProvider.genLogDirectoryPath();
    }
    return this._logDirectoryPath;
  }

  public static genLogDirectoryPath(): string {
    const logDirectoryPath = isMacOS
      ? path.join(os.homedir(), MACOS_PATHS.LOGGING_DIR, LOG_DIRECTORY_NAME)
      : path.join(os.tmpdir(), LOG_DIRECTORY_NAME);

    if (!fs.existsSync(logDirectoryPath)) {
      fs.mkdirSync(logDirectoryPath, { recursive: true });
    }

    return logDirectoryPath;
  }

  public static genZipLogDirectoryPath(dirPath: string): string {
    return path.join(dirPath, 'authenticator-logData_' + getUniqueDateString() + '.zip');
  }

  public static configDirectoryPath(): string {
    let configDirectoryPath = app.getPath('userData').replace('Roaming', 'Local');
    //C:\Users\USERNAME\AppData\Local\authenticator -> C:\Users\USERNAME\AppData\Local\gematik Authenticator
    configDirectoryPath = configDirectoryPath.replace('authenticator', 'gematik Authenticator');
    return configDirectoryPath;
  }

  public static getResourcesPath(): string {
    if (app.isPackaged) {
      return process.resourcesPath;
    }
    // #!if MOCK_MODE === 'ENABLED'
    else {
      return path.join(process.cwd(), 'src', 'assets');
    }
    // #!endif
  }
}
