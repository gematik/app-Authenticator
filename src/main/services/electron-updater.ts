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

import { autoUpdater } from 'electron-updater';
import { logger } from '@/main/services/logging';
import { ipcMain } from 'electron';
import { IPC_CANCEL_UPDATE, IPC_CHECK_UPDATE } from '@/constants';

// use our own logger for electron auto updater
autoUpdater.logger = logger;

// on default, autoInstallOnAppQuit is false
autoUpdater.autoInstallOnAppQuit = false;

ipcMain.on(IPC_CHECK_UPDATE, () => {
  /**
   * Update available and downloaded.
   */
  autoUpdater.on('update-downloaded', () => {
    // will be installed on restart
    autoUpdater.autoInstallOnAppQuit = true;
  });

  autoUpdater.on('update-not-available', (info) => {
    logger.info('Update not available.', info);
  });

  autoUpdater.on('error', (err) => {
    logger.error('Error in auto-updater. ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
    logger.info(log_message);
  });

  // call updater
  autoUpdater.checkForUpdates().then((updateStatus) => {
    logger.info('updateStatus', updateStatus);
  });
});

/**
 * Stop the active update process (even if it is already downloaded!)
 */
ipcMain.on(IPC_CANCEL_UPDATE, () => {
  autoUpdater.autoInstallOnAppQuit = false;
});
