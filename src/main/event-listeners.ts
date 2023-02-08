/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import {
  IPC_ERROR_LOG_EVENT_TYPES,
  IPC_GET_APP_PATH,
  IPC_GET_PATH,
  IPC_GET_PROXY,
  IPC_READ_MAIN_PROCESS_ENVS,
} from '@/constants';
import { logger } from '@/main/services/logging';
import { UP_TO_DATE_PROCESS_ENVS } from '@/main/services/env-vars-updater';

ipcMain.on(IPC_GET_PATH, (event, name) => {
  event.returnValue = app.getPath(name);
});

ipcMain.on(IPC_READ_MAIN_PROCESS_ENVS, (event) => {
  event.returnValue = JSON.stringify(UP_TO_DATE_PROCESS_ENVS);
});

ipcMain.on(IPC_GET_APP_PATH, (event) => {
  event.returnValue = app.getAppPath();
});

// Logger events
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.ERROR, (_event, args) => logger.error(args));
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.DEBUG, (_event, args) => logger.debug(args));
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.INFO, (_event, args) => logger.info(args));
ipcMain.on(IPC_ERROR_LOG_EVENT_TYPES.WARN, (_event, args) => logger.warn(args));

/**
 * Get OS's proxy
 */
ipcMain.on(IPC_GET_PROXY, async (event, url) => {
  const session = BrowserWindow.getFocusedWindow()?.webContents.session;

  let proxy = '';
  if (session) {
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
  }
  logger.debug('Proxy for Url:' + url + ' is:' + proxy);
  event.returnValue = proxy;
});
