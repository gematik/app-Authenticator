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

import os from 'os';
import { app } from 'electron';
// #!if MOCK_MODE === 'ENABLED'
import { IS_DEV } from '@/constants';
// #!endif
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
    // #!if MOCK_MODE === 'ENABLED'
    if (IS_DEV) {
      return path.join(process.cwd(), 'src', 'assets');
    }
    // #!endif

    const pattern = /app.asar/i;
    return process.resourcesPath.replace(pattern, '');
  }
}
