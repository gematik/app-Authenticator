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

import { logger } from '@/main/services/logging';
import { BrowserWindow } from 'electron';
import * as process from 'process';
import { IPC_UPDATE_ENV } from '@/constants';

export const UP_TO_DATE_PROCESS_ENVS = process.env;

let FOUND_ENV_VARS: Record<string, string> = {};

const WATCHED_ENV_VAR_KEYS = ['CLIENTNAME', 'AUTHCONFIGPATH', 'COMPUTERNAME'];

/**
 * interval for checking new env vars
 * @param mainWindow
 */
export const setupEnvReadInterval = (mainWindow: BrowserWindow | null) => {
  setInterval(async () => {
    await readLatestEnvs(mainWindow);
  }, 10000);
};

/**
 * Resets the FOUND_ENV_VARS and researches the latest envs. If latest changes are different from the previous
 * values, we update the UP_TO_DATE_PROCESS_ENVS object and refresh the renderer page.
 *
 * @param mainWindow
 */
export const readLatestEnvs = async (mainWindow: BrowserWindow | null): Promise<void> => {
  FOUND_ENV_VARS = {};

  for (const regKey of await envVarPlacesByPriority()) {
    // this mutates the FOUND_ENV_VARS, changes will be controlled after this for loop

    const keyValuePairsFromRegistryAsString = await readRegistryForKey(regKey);
    checkWatchedEnvVarsChange(keyValuePairsFromRegistryAsString);
  }

  let hasVarsChanged = false;

  WATCHED_ENV_VAR_KEYS.forEach((envVar) => {
    const previousVal = UP_TO_DATE_PROCESS_ENVS[envVar];
    if (FOUND_ENV_VARS[envVar] && FOUND_ENV_VARS[envVar] !== previousVal) {
      const newValue = FOUND_ENV_VARS[envVar];
      logger.info(`Env variable change detected: ${envVar} changed from ${previousVal} to ${newValue}`);
      UP_TO_DATE_PROCESS_ENVS[envVar] = newValue;
      hasVarsChanged = true;
    }
  });

  if (hasVarsChanged && mainWindow) {
    mainWindow.webContents.send(IPC_UPDATE_ENV);
  }
};

/**
 *  Returns the Path to envs in system-vars:
 *  The last one supersedes the previous ones(!)
 */
export async function envVarPlacesByPriority() {
  // The Reg-Key for the volatile Env. ( which has the highest priority for us of the Registry Keys )
  // depends on the session id, so we have to construct the key:
  const sessionID = await querySessionID();
  const volEntry = 'HKCU\\Volatile Environment' + '\\' + sessionID;

  return ['HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment', volEntry];
}

/**
 * updates ( if necessary ) special process-env-variables by reading the Windows registry and reloading of window
 * @param regKey
 */
export const readRegistryForKey = (regKey: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spawn = require('child_process').spawn;

    const bat = spawn('cmd.exe', [
      '/c', // Argument for cmd.exe to carry out the specified script
      'reg',
      'query',
      regKey,
    ]);

    let stdout = '';
    let stderr = '';

    bat.stdout.on('data', (data: any) => {
      stdout += data;
    });

    bat.stderr.on('data', (err: any) => {
      stderr += err;
    });

    bat.on('close', () => {
      // log and return on error case
      if (stderr) {
        logger.error('## readRegistryForKey, Registry Entry (' + regKey + ') not found:' + stderr.toString());
        reject(stderr.toString());
        return;
      }

      resolve(stdout.toString());
    });
  });
};

/**
 * find the Windows-Session-ID of the running authenticar-executable
 */
export const querySessionID = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spawn = require('child_process').spawn;

    const bat = spawn('cmd.exe', [
      '/c', // Argument for cmd.exe to carry out the specified script
      'query',
      'SESSION',
    ]);

    let stdout = '';
    let stderr = '';

    bat.stdout.on('data', (data: any) => {
      stdout += data;
    });

    bat.stderr.on('data', (err: any) => {
      stderr += err;
    });

    bat.on('close', () => {
      // log and return on error case
      if (stderr) {
        logger.error('## querySessionID: query not found:' + stderr.toString());
        reject(stderr.toString());
        return;
      }

      const regexLine = /^>.*$/m;
      const regexNumber = /\s(\d+)\s+.*$/;
      const multilineString = stdout.toString();
      const match = multilineString.match(regexLine);
      if (match) {
        const sessionID = match[0].match(regexNumber);

        if (sessionID) {
          resolve(sessionID[1].toString());
        }
      }
    });
  });
};

export const checkWatchedEnvVarsChange = (data: string) => {
  WATCHED_ENV_VAR_KEYS.forEach((envVar: string) => {
    const regex = new RegExp(`${envVar}\\s+\\w+\\s+(\\S+)`);
    const match = data.match(regex);
    const newValue = match && match[1];

    if (newValue) {
      FOUND_ENV_VARS[envVar] = newValue;
    }
  });
};
