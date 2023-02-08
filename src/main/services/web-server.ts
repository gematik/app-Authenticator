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

import { BrowserWindow, ipcMain } from 'electron';
import http, { IncomingMessage, ServerResponse } from 'http';

import { IPC_AUTH_FLOW_FINISH_REDIRECT_EVENT, LOCAL_HTTP_SERVER_PORT } from '@/constants';
import { decodeURLRecursively, startAuthFlow } from '@/main/services/url-service';
import { logger } from '@/main/services/logging';

export const initiateLocalWebServer = (mainWindow: BrowserWindow) => {
  const server = http.createServer(function (req: IncomingMessage, res: ServerResponse) {
    const url = (req?.headers?.host || '') + req.url;
    if (url) {
      const decodedUrl = decodeURLRecursively(url);

      try {
        startAuthFlow(decodedUrl, mainWindow, true);
      } catch (e) {
        mainWindow.maximize();
        mainWindow.focus();
      }
    }

    ipcMain.on(IPC_AUTH_FLOW_FINISH_REDIRECT_EVENT, (_event, url) => {
      res.writeHead(302, { Location: url });
      res.end();

      // minimize after login to let user see browser
      if (!mainWindow.isMinimized()) mainWindow.minimize();
    });
  });

  server.listen(LOCAL_HTTP_SERVER_PORT);

  logger.info(`Listening localhost:${LOCAL_HTTP_SERVER_PORT}`);
};
