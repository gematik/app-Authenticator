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
import { IPC_UPDATE_ENV } from '@/constants';
import fs from 'fs';
import path from 'path';
import * as process from 'process';

require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

//as compatibility reason initialize UP_TO_DATE_PROCESS_ENVS 'computername' from process env and not from registry!
export const UP_TO_DATE_PROCESS_ENVS: Record<string, string> = {
  ...process.env,
  COMPUTERNAME: process.env.COMPUTERNAME ?? '',
};

let FOUND_ENV_VARS: Record<string, string> = {};

const WATCHED_ENV_VAR_KEYS = ['CLIENTNAME', 'AUTHCONFIGPATH', 'VIEWCLIENT_MACHINE_NAME'];

const REGISTRY_KEY_SYSTEM_ENV = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment';
const REGISTRY_KEY_SOFTWARE_CITRIX_ICA_SESSION = 'HKLM\\SOFTWARE\\Citrix\\Ica\\Session';

/**
 * interval for checking new env vars
 * @param mainWindow
 */
export const setupEnvReadInterval = (mainWindow: BrowserWindow | null) => {
  setInterval(async () => {
    await readLatestEnvs(mainWindow);
  }, 10000);

  readLatestEnvs(mainWindow).then(() => logger.debug('env loaded'));
};

/**
 *  Returns the registry path to envs in volatile environment:
 */
async function getVolatileEnv(): Promise<string> {
  const sessionID = await querySessionID();
  return 'HKCU\\Volatile Environment' + '\\' + sessionID;
}

/**
 * Resets the FOUND_ENV_VARS and researches the latest envs. If latest changes are different from the previous
 * values, we update the UP_TO_DATE_PROCESS_ENVS object and refresh the renderer page.
 *
 * @param mainWindow
 */
export const readLatestEnvs = async (mainWindow: BrowserWindow | null): Promise<void> => {
  FOUND_ENV_VARS = {};
  try {
    const keyValuePairsFromRegistryAsString = await readRegistryForKey(REGISTRY_KEY_SYSTEM_ENV);
    checkEnvVarsChange('AUTHCONFIGPATH', keyValuePairsFromRegistryAsString);
  } catch (e) {
    logger.debug('Error when reading the registry key for AUTHCONFIGPATH: ' + REGISTRY_KEY_SYSTEM_ENV);
  }
  try {
    const keyValuePairsFromRegistryAsString = await getVolatileEnv().then((value) => readRegistryForKey(value));
    checkEnvVarsChange('VIEWCLIENT_MACHINE_NAME', keyValuePairsFromRegistryAsString);
  } catch (e) {
    logger.debug('Error when reading the registry key for volatile envs');
  }
  try {
    const keyValuePairsFromRegistryAsString = await readRegistryForKey(REGISTRY_KEY_SOFTWARE_CITRIX_ICA_SESSION);
    checkEnvVarsChange('CLIENTNAME', keyValuePairsFromRegistryAsString);
  } catch (e) {
    logger.debug('Error when reading the registry key for CLIENTNAME: ' + REGISTRY_KEY_SOFTWARE_CITRIX_ICA_SESSION);
  }

  let hasVarsChanged = false;
  WATCHED_ENV_VAR_KEYS.forEach((envVar) => {
    const previousVal = UP_TO_DATE_PROCESS_ENVS[envVar];

    if (!FOUND_ENV_VARS[envVar]) {
      logger.debug(`Env variable change ignored for ${envVar} as it is empty`);
      return;
    }
    if (FOUND_ENV_VARS[envVar] !== previousVal?.toUpperCase()) {
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
 * find the Windows-Session-ID of the running authenticator-executable
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

export const checkEnvVarsChange = (variable: string, data: string) => {
  //Check only the lines where the variable exists, because the regex did not work on the whole text.
  data
    .toUpperCase()
    .split(/\r\n|\r|\n/)
    .forEach((line) => {
      if (line.includes(variable)) {
        const regex = new RegExp(`${variable}\\s+\\w+\\s+(\\S+)`);
        const match = line.match(regex);
        const newValue = match?.[1] && match[1];

        // when  authconfigpath doesn't exist ignore it
        if (variable === 'AUTHCONFIGPATH' && newValue && !fs.existsSync(path.join(newValue))) {
          FOUND_ENV_VARS[variable] = '';
          logger.debug('The AUTHCONFIGPATH is ignored because it does not exist: ', newValue);
        } else {
          FOUND_ENV_VARS[variable] = newValue || '';
        }
      }
    });
};
