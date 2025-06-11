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

import { ipcRenderer, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import {
  IPC_FOCUS_TO_AUTHENTICATOR,
  IPC_GET_APP_PATH,
  IPC_SELECT_FOLDER,
  P12_VALIDITY_TYPE,
  IS_DEV,
} from '@/constants';
import { HTTP_METHODS, httpClient, TClientRes } from '@/main/services/http-client';
import { Options } from 'got';
import { createLogZip, logger } from '@/main/services/logging';
import { findValidCertificate, getP12ValidityType } from '@/main/services/p12-certificate-service';
import IpcRendererEvent = Electron.IpcRendererEvent;

const { webUtils } = require('electron');

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
    await shell.openExternal(url);
  },
  getProcessEnvs: () => {
    return { ...process.env };
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
  httpGet: async (url: string, config: Options = {}): Promise<TClientRes | undefined> => {
    return await httpClient(HTTP_METHODS.GET, url, config);
  },
  httpPost: async (url: string, envelope: any, config: Options = {}) => {
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
   * Check if the p12 file is valid
   * @param p12Path file path to p12
   * @param password p12 file password
   */
  isP12Valid(p12Path: string, password: string): P12_VALIDITY_TYPE {
    try {
      return getP12ValidityType(p12Path, password);
    } catch (error) {
      if (error.message.includes('PKCS#12 MAC could not be verified. Invalid password?')) {
        logger.info('Password is incorrect: ', error);
        return P12_VALIDITY_TYPE.WRONG_PASSWORD;
      }
      logger.info('Exception by processing certificate validation: ', error);
      return P12_VALIDITY_TYPE.PROCESSING_EXCEPTION;
    }
  },
  extractValidCertificate(p12Path: string, password: string): string {
    const certificate = findValidCertificate(p12Path, password);
    const newP12 = forge.pkcs12.toPkcs12Asn1(certificate.privateKey?.key, [certificate.certificate?.cert], password);
    const derData = forge.asn1.toDer(newP12).getBytes();
    // Save the updated P12 file

    const newFilePath = path.join(os.tmpdir(), path.basename(p12Path));
    fs.writeFileSync(newFilePath, derData, 'binary');
    return newFilePath;
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
};
