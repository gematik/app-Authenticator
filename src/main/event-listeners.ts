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

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import {
  IPC_ERROR_LOG_EVENT_TYPES,
  IPC_GET_APP_PATH,
  IPC_GET_PATH,
  IPC_GET_PROXY,
  IPC_READ_CERTIFICATES,
  IPC_READ_CREDENTIALS,
  IPC_READ_MAIN_PROCESS_ENVS,
  IPC_SAVE_CREDENTIALS,
  IPC_SELECT_FOLDER,
} from '@/constants';
import { logger } from '@/main/services/logging';
import { UP_TO_DATE_PROCESS_ENVS } from '@/main/services/env-vars-updater';
import { getSensitiveConfigValues, saveSensitiveConfigValues } from '@/main/services/credentials-manager';
import { getCertificates } from '@/main/services/read-root-certs';

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

    logger.debug('Proxy resolved: ' + res);
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

ipcMain.handle(IPC_READ_CERTIFICATES, async () => {
  try {
    return getCertificates();
  } catch (error) {
    logger.error('Error retrieving certificates from trust store:', error);
    return [];
  }
});
