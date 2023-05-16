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

import { ipcRenderer, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import { IPC_FOCUS_TO_AUTHENTICATOR, IPC_SELECT_FOLDER, P12_VALIDITY_TYPE } from '@/constants';
import { HTTP_METHODS, httpClient, TClientRes } from '@/main/services/http-client';
import { Options } from 'got';
import { createLogZip, logger } from '@/main/services/logging';
const forge = require('node-forge');
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
    return true;
  },
  /**
   * Check if the p12 file is valid
   * @param p12Path
   * @param password
   */
  isP12Valid(p12Path: string, password: string): P12_VALIDITY_TYPE {
    try {
      // Read the p12 file
      const p12File = fs.readFileSync(p12Path, 'binary');
      // Load the PKCS #12 file using forge
      const p12Asn1 = forge.asn1.fromDer(p12File);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
      // Extract key and certificate information
      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag][0];
      const certificate = certBag.cert;
      if (certificate.validity.notAfter > new Date()) {
        return P12_VALIDITY_TYPE.VALID;
      } else {
        logger.info('Certificate is outdated');
        return P12_VALIDITY_TYPE.CERT_OUTDATED;
      }
    } catch (error) {
      if (error.message.includes('PKCS#12 MAC could not be verified. Invalid password?')) {
        logger.info('Password is incorrect: ', error);
        return P12_VALIDITY_TYPE.WRONG_PASSWORD;
      }
      logger.info('Certificate is invalid: ', error);
      return P12_VALIDITY_TYPE.CERT_INVALID;
    }
  },
};
