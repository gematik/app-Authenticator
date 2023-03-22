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

/**
 * @jest-environment node
 */
import * as envVarsUpdater from '@/main/services/env-vars-updater';
import { UP_TO_DATE_PROCESS_ENVS } from '../../src/main/services/env-vars-updater';

describe('test env-vars-updater', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
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
});
