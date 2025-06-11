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

// read envs from .env file for production
import { app, BrowserWindow, Event, ipcMain, protocol } from 'electron';
import path from 'path';

import {
  CUSTOM_PROTOCOL_NAME,
  IPC_FOCUS_TO_AUTHENTICATOR,
  IPC_MINIMIZE_THE_AUTHENTICATOR,
  IPC_SET_USER_AGENT,
} from '@/constants';
import appConfigFactory from '../../app-config';
import { handleDeepLink } from '@/main/services/url-service';

import { logger } from '@/main/services/logging';
import { setupEnvReadInterval } from '@/main/services/env-vars-updater';
// import and add event listeners for electron updater
import '@/main/services/electron-updater';
import { hasAppRemoteDebuggingFlags } from '@/main/services/utils';
import copyFromResourcesToTarget from '@/main/services/copy-from-resources-to-target';
import { setMacOSDockShortcuts, setWindowsTaskbarShortcuts } from '@/renderer/utils/os-menu-shortcuts';

require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

import OnBeforeSendHeadersListenerDetails = Electron.OnBeforeSendHeadersListenerDetails;
import BeforeSendResponse = Electron.BeforeSendResponse;

// #!if MOCK_MODE === 'ENABLED'
/**
 * @deprecated IS_DEV only can be used with MOCK_MODE == 'ENABLED' check
 */
const IS_DEV = process.env.NODE_ENV === 'development';
// #!endif

const PLATFORM_WIN32 = 'win32';
const PLATFORM_DARWIN = 'darwin';

if (process.platform === PLATFORM_WIN32) {
  setWindowsTaskbarShortcuts();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;

logger.info(`Starting ${app.getName()} application...`);
logger.info(`Program version: ${app.getVersion()}`);
logger.info(`Electron version: ${process.versions.electron}`);
logger.info(`Platform: ${process.platform}`);

// #!if MOCK_MODE === 'ENABLED'
logger.info(`Not running in production mode: ${process.env.NODE_ENV}, mock: ${process.env.MOCK_MODE}`);
// #!endif

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

// clean aged log files
const appConfig = appConfigFactory();

// call event native listeners
require('./event-listeners');

// on macos open-url get triggered before app ready, so we need to save it and call it later
let deepLink = '';

/**
 * The user agent is set by the renderer process.
 * This changes for the request. That's why we need to update it every time.
 */
let customUserAgent = '';
ipcMain.on(IPC_SET_USER_AGENT, (event, userAgent) => {
  customUserAgent = userAgent;
  event.returnValue = true;
});

async function createWindow() {
  let devTools = false;

  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV || process.env.MOCK_MODE === 'ENABLED') {
    devTools = true;
  }
  // #!endif

  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: appConfig.title,
    width: appConfig.width,
    height: appConfig.height,
    minHeight: appConfig.minHeight,
    minWidth: appConfig.minWidth,
    center: true,
    icon: appConfig.icon,
    resizable: appConfig.resizable,
    backgroundColor: '#F8F9FC',
    autoHideMenuBar: true,
    webPreferences: {
      devTools,
      sandbox: false, // necessary for us after version 20 as we use NodeJS features in the preload.ts
      webSecurity: appConfig.webSecurity,
      allowRunningInsecureContent: appConfig.webSecurity,
      nodeIntegration: false, // we always keep this FALSE as it is secure
      contextIsolation: true, // we always keep this TRUE as it is secure
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // change http request headers to bypass CORS
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details: OnBeforeSendHeadersListenerDetails, callback: (beforeSendResponse: BeforeSendResponse) => void) => {
      callback({
        requestHeaders: {
          Origin: '*',
          ...details.requestHeaders,
          'User-Agent': customUserAgent,
        },
      });
    },
  );

  // change http response headers to bypass CORS
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        ...details.responseHeaders,
      },
    });
  });

  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    // Load the url of the dev server if in development mode
    const port = '3000';
    await mainWindow.loadURL('http://localhost:' + port + '/');
  } else {
    // #!endif

    // Load the index.html when not in development
    // this file is the bundled version of the src/renderer/template.html
    await mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // #!if MOCK_MODE === 'ENABLED'
  }
  // #!endif

  // todo fix this for macOS's production
  if (process.platform === PLATFORM_WIN32) {
    await setupEnvReadInterval(mainWindow);
  }
  handleDeepLink(process.argv, mainWindow);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    logger.info('Application window closed. Bye bye.');
  });

  /**
   * focus to authenticator app
   * We use this functionality on an error case
   */
  ipcMain.on(IPC_FOCUS_TO_AUTHENTICATOR, () => {
    if (mainWindow) {
      // foreground the app
      if (mainWindow.isMinimized()) mainWindow.restore();

      // focus to app
      mainWindow.focus();
    }
  });
  /**
   * minimize the authenticator app
   * We use this functionality if the authenticator is finish successfully
   */
  ipcMain.on(IPC_MINIMIZE_THE_AUTHENTICATOR, () => {
    mainWindow?.minimize();
  });

  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    mainWindow.maximize();
    mainWindow.webContents.openDevTools();
  }
  // #!endif

  /**
   * Prevent navigating to another websites
   */
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
}

// Force single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.info('Application quit because of single instance lock');
  app.quit();
} else if (hasAppRemoteDebuggingFlags()) {
  // quit the app if it has remote debugging flags
  logger.error('Application quit because of debugging flags');
  app.quit();
} else {
  // start the app
  app.on('second-instance', (_e: Event, argv: string[]) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      handleDeepLink(argv, mainWindow);
    }
  });

  // Deeplink event listener for MacOS
  app.on('open-url', async (e, argv) => {
    e.preventDefault();

    // if the app is not ready, save the deep link and call it later
    if (mainWindow) {
      if (process.platform === PLATFORM_WIN32) {
        await setupEnvReadInterval(mainWindow);
      }

      handleDeepLink([argv], mainWindow);
      deepLink = '';
    } else {
      deepLink = argv;
    }
  });

  // #!if MOCK_MODE === 'ENABLED'
  // register url schemas
  if (IS_DEV && process.platform === PLATFORM_WIN32) {
    logger.info('Register URL schemas for platform WIN32.');
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on Windows.
    // Setting this is required to get this working in dev mode.
    app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    // #!endif
    app.setAsDefaultProtocolClient(CUSTOM_PROTOCOL_NAME);
    // #!if MOCK_MODE === 'ENABLED'
  }
  // #!endif

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', async () => {
    // copy certs and config files to to target on macos
    if (process.platform === PLATFORM_DARWIN) {
      copyFromResourcesToTarget();
    }

    logger.info('Application is ready');
    await createWindow();

    // call previously saved deep link, which was called in the open-url event
    if (deepLink) {
      handleDeepLink([deepLink], mainWindow);
      deepLink = '';
    }

    if (process.platform === PLATFORM_DARWIN) {
      setMacOSDockShortcuts()
        .then(() => logger.debug('Mac Dock shortcuts set'))
        .catch((error: unknown) => logger.error('Error setting Mac Dock shortcuts', error));
    }
  });

  /**
   * never allows open new windows
   */
  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS, it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== PLATFORM_DARWIN) {
      logger.info('Application quit because all windows are closed');
      app.quit();
    }
  });

  app.on('activate', async () => {
    // On macOS, it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });

  // Exit cleanly on request from parent process in development mode.
  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    if (process.platform === PLATFORM_WIN32) {
      process.on('message', (data) => {
        if (data === 'graceful-exit') {
          logger.info('Application quit because of graceful exit');
          app.quit();
        }
      });
    } else {
      process.on('SIGTERM', () => {
        logger.info('Application quit because of sigterm');
        app.quit();
      });
    }
  }
  // #!endif
}
