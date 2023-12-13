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

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import {
  IPC_ERROR_LOG_EVENT_TYPES,
  IPC_GET_APP_PATH,
  IPC_GET_PATH,
  IPC_GET_PROXY,
  IPC_READ_CREDENTIALS,
  IPC_READ_MAIN_PROCESS_ENVS,
  IPC_SAVE_CREDENTIALS,
  IPC_SELECT_FOLDER,
} from '@/constants';
import { logger } from '@/main/services/logging';
import { UP_TO_DATE_PROCESS_ENVS } from '@/main/services/env-vars-updater';
import { getSensitiveConfigValues, saveSensitiveConfigValues } from '@/main/services/credentials-manager';

ipcMain.on(IPC_GET_PATH, (event, name) => {
  event.returnValue = app.getPath(name);
});

ipcMain.on(IPC_READ_MAIN_PROCESS_ENVS, (event) => {
  event.returnValue = JSON.stringify(UP_TO_DATE_PROCESS_ENVS);
});

ipcMain.on(IPC_GET_APP_PATH, (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on(IPC_SELECT_FOLDER, (event) => {
  event.returnValue = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
});

// Logger events
// @ts-ignore
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.ERROR, (_event, args) => logger.error(...args));
// @ts-ignore
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.DEBUG, (_event, args) => logger.debug(args));
// @ts-ignore
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.INFO, (_event, args) => logger.info(args));
// @ts-ignore
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.WARN, (_event, args) => logger.warn(args));

/**
 * Get OS's proxy
 */
ipcMain.on(IPC_GET_PROXY, async (event, url) => {
  const session = BrowserWindow.getAllWindows()[0].webContents.session;

  let proxy = '';
  if (session) {
    logger.info('Session found for resolving proxy');
    const res = await session.resolveProxy(url);

    logger.debug('Proxy resolved:' + res);
    if (res !== 'DIRECT') {
      const parts = res.trim().split(/\s+/);
      const type = parts[0];
      let proxyUrl = parts[1];
      if (proxyUrl.includes(';')) {
        proxyUrl = proxyUrl.split(';')[0];
      }
      proxy = ('HTTPS' === type ? 'https' : 'http') + '://' + proxyUrl;
    }
  } else {
    logger.info('No session found for resolving proxy');
  }
  logger.debug('Proxy for Url:' + url + ' is:' + proxy);
  event.returnValue = proxy;
});

ipcMain.on(IPC_READ_CREDENTIALS, async (event) => {
  event.returnValue = await getSensitiveConfigValues();
});

ipcMain.on(IPC_SAVE_CREDENTIALS, async (event, data) => {
  event.returnValue = await saveSensitiveConfigValues(data);
});
