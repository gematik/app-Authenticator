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

/**
 * @jest-environment node
 */
import * as envVarsUpdater from '@/main/services/env-vars-updater';
import { readRegistryForKey, UP_TO_DATE_PROCESS_ENVS } from '@/main/services/env-vars-updater';

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

    jest
      .spyOn(envVarsUpdater, 'readRegistryForKey')
      .mockResolvedValue(
        'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment\n    CLIENTNAME    REG_SZ    NW005',
      );

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

  it('should reject with an error message when the registry key is not found', async () => {
    const mockError = 'test error';
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
      expect(err).toEqual(mockError);
    }
  });

  it('should return the output of the registry query', async () => {
    const mockOutput = 'test output';
    const mockSpawn = jest.spyOn(require('child_process'), 'spawn').mockImplementation(() => {
      const mockChild = {
        stdout: {
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'data') {
              callback(mockOutput);
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'close') {
            callback();
          }
        }),
      };
      return mockChild as any;
    });

    const result = await readRegistryForKey('test key');

    expect(result).toEqual(mockOutput);
  });
});
