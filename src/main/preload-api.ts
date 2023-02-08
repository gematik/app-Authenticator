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

import { ipcRenderer, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import { IPC_FOCUS_TO_AUTHENTICATOR } from '@/constants';
import { HTTP_METHODS, httpClient } from '@/main/services/http-client';

/**
 * Config data for preload environment.
 * This will be kept up-to-date with frontend config data
 */
export let APP_CONFIG_DATA: Record<string, unknown> = {};

export let APP_CA_CHAIN_IDP: string[] = [];

export const preloadApi = {
  send: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data);
  },
  sendSync: (channel: string, data: unknown) => {
    return ipcRenderer.sendSync(channel, data);
  },
  on: (channel: string, func: any) => {
    ipcRenderer.on(channel, (event: unknown, ...args: unknown[]) => func(event, ...args));
  },
  openExternal: async (url: string) => {
    await shell.openExternal(url);
  },
  getProcessEnvs: () => {
    return { ...process.env };
  },
  getProcessCwd: () => {
    return process.cwd();
  },
  isFile: (filePath: string): boolean => {
    return fs.statSync(filePath).isFile();
  },
  readFileSync: fs.readFileSync,
  copyFileSync: fs.copyFileSync,
  readdirSync: fs.readdirSync,
  existsSync: fs.existsSync,
  unlinkSync: fs.unlinkSync,
  mkdirSync: fs.mkdirSync,
  writeFileSync: fs.writeFileSync,
  utilFormat: util.format,
  pathJoin: path.join,
  pathSep: (): string => {
    return path.sep;
  },
  focusToApp: (): void => {
    ipcRenderer.send(IPC_FOCUS_TO_AUTHENTICATOR);
  },
  getTmpDir: os.tmpdir,
  nativeURL: require('url').URL,
  httpsAgent: require('https').Agent,
  httpGet: async (url: string, followRedirect: boolean, config: any) => {
    return await httpClient(HTTP_METHODS.GET, url, followRedirect, config);
  },
  httpPost: async (url: string, envelope: any, config: any = {}) => {
    return await httpClient(HTTP_METHODS.POST, url, false, config, envelope);
  },
  setAppConfigInPreload(data: Record<string, unknown>) {
    APP_CONFIG_DATA = data;
  },

  setCaChainIdpInPreload(data: string[]) {
    APP_CA_CHAIN_IDP = data;
  },
};
