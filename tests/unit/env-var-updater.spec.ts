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

/**
 * @jest-environment node
 */
import * as envVarsUpdater from '@/main/services/env-vars-updater';
import { readRegistryForKey, UP_TO_DATE_PROCESS_ENVS } from '@/main/services/env-vars-updater';
import os from 'os';

jest.mock('electron-edge-js', () => ({
  func: jest.fn((config) => {
    // Je nach config.methodName unterschiedliche Mock-Implementierung bereitstellen
    if (config.methodName === 'GeKeyFromRegistry') {
      return (key: String, callback: Function) => {
        // Simuliere hier den gewünschten Output
        if (key.includes('NotFound')) {
          // Beispielhafter Fall für Fehler
          callback(new Error('Key not found'));
        } else {
          callback(null, 'test output');
        }
      };
    } else if (config.methodName === 'GetCurrentSessionId') {
      return (arg: String, callback: Function) => {
        callback(null, 'MOCKED_SESSION_ID');
      };
    }
    // Falls eine Methode nicht explizit abgehandelt wird
    return (arg: String, callback: Function) => callback(null, '');
  }),
}));

describe('test env-vars-updater', () => {
  beforeEach(() => {
    //jest.resetModules();
    //jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('reads latest envs and does not detects any change ', async function () {
    jest.spyOn(envVarsUpdater, 'readRegistryForKey').mockResolvedValue('');
    jest.spyOn(envVarsUpdater, 'querySessionID').mockResolvedValue('1');

    const mainWindow = { webContents: { send: jest.fn() } };

    // @ts-ignore
    await envVarsUpdater.readLatestEnvs(mainWindow);
    expect(mainWindow.webContents.send).toHaveBeenCalledTimes(0);
  });

  it('Detects change and updates the UP_TO_DATE_PROCESS_ENVS', async function () {
    expect(UP_TO_DATE_PROCESS_ENVS.CLIENTNAME).toBeUndefined();

    jest.spyOn(envVarsUpdater, 'readRegistryForKey').mockResolvedValue('CLIENTNAME: NW005');

    jest.spyOn(envVarsUpdater, 'querySessionID').mockResolvedValue('1');

    const mainWindow = { webContents: { send: jest.fn() } };

    // @ts-ignore
    await envVarsUpdater.readLatestEnvs(mainWindow);

    // renderer gets updated
    expect(mainWindow.webContents.send).toHaveBeenCalledTimes(1);

    expect(mainWindow.webContents.send).toHaveBeenCalledWith('IPC_UPDATE_ENV');

    // UP_TO_DATE_PROCESS_ENVS gets updated
    expect(UP_TO_DATE_PROCESS_ENVS.CLIENTNAME).toBe('NW005');
  });

  (os.platform() === 'win32' ? it : it.skip)(
    'should reject with an error message when the registry key is not found',
    async () => {
      const mockError = 'Key not found';
      const mockSpawn = jest.spyOn(require('child_process'), 'spawn').mockImplementation(() => {
        const mockChild = {
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn().mockImplementation((event, callback) => {
              if (event === 'data') {
                callback(mockError);
              }
            }),
          },
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'close') {
              callback();
            }
          }),
        };
        return mockChild as any;
      });

      try {
        await readRegistryForKey('test key');
      } catch (err) {
        expect(err.message).toEqual(mockError);
      }
    },
  );
});
