/*
 * Copyright 2026, gematik GmbH
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

import { ipcRenderer, shell, webUtils } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import {
  IPC_FOCUS_TO_AUTHENTICATOR,
  IPC_GET_APP_PATH,
  IPC_SELECT_FOLDER,
  IS_DEV,
  P12_VALIDITY_TYPE,
} from '@/constants';
import { HTTP_METHODS, httpClient, HTTPClientConfig, TClientRes } from '@/main/services/http-client';
import { createLogZip, logger } from '@/main/services/logging';
import IpcRendererEvent = Electron.IpcRendererEvent;

const forge = require('node-forge');

type IpcRendererCallback = (event: IpcRendererEvent, ...args: any[]) => void;

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
  on: (channel: string, func: IpcRendererCallback) => {
    ipcRenderer.on(channel, (event: IpcRendererEvent, ...args: any[]) => func(event, ...args));
  },
  openExternal: async (url: string) => {
    await shell.openExternal(url, { activate: true });
  },
  getProcessCwd: () => {
    // #!if MOCK_MODE === 'ENABLED'
    if (IS_DEV) {
      return process.cwd();
    }
    // #!endif
    const appPath = ipcRenderer.sendSync(IPC_GET_APP_PATH);

    const pattern = /app.asar/i;
    return appPath?.replace(pattern, '') || '';
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
  homedir: os.homedir,
  pathSep: (): string => {
    return path.sep;
  },
  pathDirname: (filePath: string): string => {
    return path.dirname(filePath);
  },
  focusToApp: (): void => {
    ipcRenderer.send(IPC_FOCUS_TO_AUTHENTICATOR);
  },
  getTmpDir: os.tmpdir,
  nativeURL: require('url').URL,
  httpsAgent: require('https').Agent,
  httpGet: async (url: string, config: HTTPClientConfig = {}): Promise<TClientRes | undefined> => {
    return await httpClient(HTTP_METHODS.GET, url, config);
  },
  httpPost: async (url: string, envelope: any, config: HTTPClientConfig = {}) => {
    return await httpClient(HTTP_METHODS.POST, url, config, envelope);
  },
  setAppConfigInPreload(data: Record<string, unknown>) {
    APP_CONFIG_DATA = data;
  },
  setCaChainIdpInPreload(data: string[]) {
    APP_CA_CHAIN_IDP = data;
  },
  createLogZipFile: async (): Promise<boolean> => {
    // send event to main process to select folder
    const path = await ipcRenderer.sendSync(IPC_SELECT_FOLDER);
    if (path === undefined) {
      return false;
    }
    await createLogZip(path[0]);
    // open the folder and go inside for easy access to the zip file
    await shell.openPath(path[0]);
    return true;
  },
  /**
   * Check if the p12 file password is correct
   * @param p12Path file path to p12
   * @param password p12 file password
   */
  isP12Valid(p12Path: string, password: string): P12_VALIDITY_TYPE {
    try {
      const p12File = fs.readFileSync(p12Path, 'binary');
      const p12Asn1 = forge.asn1.fromDer(p12File);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // Check certificate expiration
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certs = certBags[forge.pki.oids.certBag];
      if (certs && certs.length > 0) {
        const now = new Date();
        for (const certBag of certs) {
          if (certBag.cert && certBag.cert.validity) {
            if (now > certBag.cert.validity.notAfter) {
              logger.info('Certificate is expired');
              return P12_VALIDITY_TYPE.EXPIRED;
            }
          }
        }
      }

      return P12_VALIDITY_TYPE.VALID;
    } catch (error: any) {
      if (error.message?.includes('PKCS#12 MAC could not be verified')) {
        logger.info('Password is incorrect: ', error);
        return P12_VALIDITY_TYPE.WRONG_PASSWORD;
      }
      // For any other error, assume password is wrong
      logger.info('P12 validation error: ', error);
      return P12_VALIDITY_TYPE.WRONG_PASSWORD;
    }
  },
  isMacOS: (): boolean => {
    return os.platform() === 'darwin';
  },
  readLicenceFile: (): string => {
    // #!if MOCK_MODE === 'ENABLED'
    if (process.env.NODE_ENV === 'development') {
      return fs.readFileSync('License.txt', 'latin1');
    }
    // #!endif

    return fs.readFileSync(path.join(__dirname, '..', '..', 'License.txt'), 'latin1');
  },
  showFilePath(file: File): string {
    return webUtils.getPathForFile(file);
  },
  readThirdPartyLicenses: () => ipcRenderer.invoke('readThirdPartyLicenses'),
};
