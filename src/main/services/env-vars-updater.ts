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
import { logger } from '@/main/services/logging';
import { BrowserWindow } from 'electron';
import { EXPOSED_ENV_VARIABLES, IPC_UPDATE_ENV, IS_DEV } from '@/constants';
import { callEdgeMethod } from '@/main/services/edge-js-dll-service';
import fs from 'fs';
import path from 'path';
import * as process from 'process';

require('dotenv').config({ path: path.join(process.cwd(), '.env'), override: false });

export const UP_TO_DATE_PROCESS_ENVS: Record<string, string> = {};

// initialize UP_TO_DATE_PROCESS_ENVS with process env variables
EXPOSED_ENV_VARIABLES.forEach((envVar) => {
  if (process.env[envVar]) {
    UP_TO_DATE_PROCESS_ENVS[envVar] = process.env[envVar] ?? '';
  }
});

let FOUND_ENV_VARS: Record<string, string> = {};
const WATCHED_ENV_VAR_KEYS = ['CLIENTNAME', 'AUTHCONFIGPATH', 'VIEWCLIENT_MACHINE_NAME'];

const REGISTRY_KEY_SYSTEM_ENV = 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment';
const REGISTRY_KEY_SOFTWARE_CITRIX_ICA_SESSION = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Citrix\\Ica\\Session';

let assemblyFile: string = 'resources/WinCertStoreLib.dll';
// #!if MOCK_MODE === 'ENABLED'
if (IS_DEV) {
  assemblyFile = path.join(__dirname, 'WinCertStoreLib.dll');
}

// #!endif

async function getKeyValueFromWindowsRegistry(key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      return reject(new Error('Registry access is not supported on non-Windows platforms.'));
    }
    try {
      const getKeyValueFromWindowsReg = callEdgeMethod('GetKeyFromRegistry');
      getKeyValueFromWindowsReg(key, function (error: Error, result: unknown) {
        if (error) {
          return reject(error);
        }
        if (!result || result === '') {
          return reject(new Error('Key not found'));
        }
        resolve(result as string);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export const setupEnvReadInterval = async (mainWindow: BrowserWindow | null) => {
  setInterval(async () => {
    await readLatestEnvs(mainWindow);
  }, 10000);
  try {
    await readLatestEnvs(mainWindow);

    // On startup, we wait for the ENVS to load; this may take a while because of the event.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.debug('Environment variables loaded');
  } catch (e) {
    logger.error('Environment variables not loaded', e);
  }
};

/**
 *  Returns the registry path to envs in volatile environment:
 */
async function getVolatileEnv(): Promise<string> {
  const sessionID = await querySessionID();
  return 'HKEY_CURRENT_USER\\Volatile Environment\\' + sessionID;
}

/**
 * Resets the FOUND_ENV_VARS and researches the latest envs. If latest changes are different from the previous
 * values, we update the UP_TO_DATE_PROCESS_ENVS object and refresh the renderer page.
 *
 * @param mainWindow
 */
const envVarChangedToEmptyLogged: { [key: string]: boolean } = {};
let readingRegistryErrorLogged = false;
export const readLatestEnvs = async (mainWindow: BrowserWindow | null): Promise<void> => {
  FOUND_ENV_VARS = {};
  try {
    const keyValuePairsFromRegistryAsString = await readRegistryForKey(REGISTRY_KEY_SYSTEM_ENV);
    checkEnvVarsChange('AUTHCONFIGPATH', keyValuePairsFromRegistryAsString);
  } catch (e) {
    if (!readingRegistryErrorLogged) {
      logger.debug('Error when reading the registry key for AUTHCONFIGPATH: ' + REGISTRY_KEY_SYSTEM_ENV);
      readingRegistryErrorLogged = true;
    }
  }
  try {
    const keyValuePairsFromRegistryAsString = await getVolatileEnv()
      .then((value) => {
        return getKeyValueFromWindowsRegistry(value).then((result: string) => {
          if (result) {
            return result;
          }
          throw new Error('Key not found');
        });
      })
      .catch(() => {
        logger.debug('Error when reading the registry key for volatile envs');
        return '';
      });

    checkEnvVarsChange('VIEWCLIENT_MACHINE_NAME', keyValuePairsFromRegistryAsString);
  } catch (e) {
    if (!readingRegistryErrorLogged) {
      logger.debug('Error when reading the registry key for volatile envs');
      readingRegistryErrorLogged = true;
    }
  }
  try {
    const keyValuePairsFromRegistryAsString = await readRegistryForKey(REGISTRY_KEY_SOFTWARE_CITRIX_ICA_SESSION);
    checkEnvVarsChange('CLIENTNAME', keyValuePairsFromRegistryAsString);
  } catch (e) {
    if (!readingRegistryErrorLogged) {
      logger.debug('Error when reading the registry key for CLIENTNAME: ' + REGISTRY_KEY_SOFTWARE_CITRIX_ICA_SESSION);
      readingRegistryErrorLogged = true;
    }
  }

  let hasVarsChanged = false;
  WATCHED_ENV_VAR_KEYS.forEach((envVar) => {
    const previousVal = UP_TO_DATE_PROCESS_ENVS[envVar];
    if (!FOUND_ENV_VARS[envVar]) {
      if (!envVarChangedToEmptyLogged[envVar]) {
        logger.debug(`Env variable change ignored for ${envVar} as it is empty`);
        envVarChangedToEmptyLogged[envVar] = true;
      }
      return;
    }
    if (FOUND_ENV_VARS[envVar] !== previousVal?.toUpperCase()) {
      const newValue = FOUND_ENV_VARS[envVar];
      logger.info(`Environment variable change detected: ${envVar} changed from ${previousVal} to ${newValue}`);
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
let readingErrorIsLogged = false;
export const readRegistryForKey = (regKey: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    getKeyValueFromWindowsRegistry(regKey)
      .then((value) => {
        if (value) {
          resolve(value);
        }
      })
      .catch((e: Error) => {
        if (!readingErrorIsLogged) {
          logger.warn(
            `## readRegistryForKey, Registry Entry (${regKey}) not found: ${e.toString()} (If you have not configured the AUTHCONFIGPATH you can ignore this message)`,
          );
        }
        readingErrorIsLogged = true;
        reject(e);
      });
  });
};

export const querySessionID = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      return reject(new Error('Registry access is not supported on non-Windows platforms.'));
    }
    try {
      const getQuerySessionID = callEdgeMethod('GetCurrentSessionId');
      getQuerySessionID('no parameter', function (error: Error, result: unknown) {
        if (error) {
          reject(error);
        }
        if (!result || result === '') {
          reject(new Error('Could not get session ID'));
        } else {
          resolve(result as string);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const checkEnvVarsChange = (variable: string, data: string) => {
  // Split the input data into lines
  data
    .toUpperCase()
    .split(/\r\n|\r|\n/)
    .forEach((line) => {
      // Check if the line contains the variable
      if (line.startsWith(`${variable}:`)) {
        // Extract the value after "VARIABLE:"
        const regex = new RegExp(`${variable}:\\s*(\\S+)`);
        const match = line.match(regex);
        const newValue = match?.[1] && match[1];

        // Special case for AUTHCONFIGPATH
        if (variable === 'AUTHCONFIGPATH' && newValue && !fs.existsSync(path.join(newValue))) {
          FOUND_ENV_VARS[variable] = '';
          logger.debug('The AUTHCONFIGPATH is ignored because it does not exist: ', newValue);
        } else {
          FOUND_ENV_VARS[variable] = newValue || '';
        }
      }
    });
};
