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

import fs from 'fs';
import url from 'url';
import https from 'https';
import os from 'os';
import util from 'util';
import path from 'path';
import { Options } from 'got';
import { TClientRes } from '@/main/services/http-client';
import { P12_VALIDITY_TYPE } from '@/constants';

export declare global {
  interface Window {
    api: {
      on: (eventName: string, callback) => void;
      send: (eventName: string, ...arguments: unknown[]) => unknown;
      sendSync: (eventName: string, ...arguments: unknown[]) => unknown;
      openExternal: (eventName: string) => void;
      focusToApp: () => void;
      isFile: (string: string) => boolean;
      readFileSync: typeof fs.readFileSync;
      copyFileSync: typeof fs.copyFileSync;
      readdirSync: typeof fs.readdirSync;
      existsSync: typeof fs.existsSync;
      unlinkSync: typeof fs.unlinkSync;
      mkdirSync: typeof fs.mkdirSync;
      writeFileSync: typeof fs.writeFileSync;
      pathJoin: typeof path.join;
      pathDirname: typeof path.dirname;
      pathSep: () => string;
      getTmpDir: typeof os.tmpdir;
      utilFormat: typeof util.format;
      nativeURL: typeof url.URL;
      httpsAgent: typeof https.Agent;
      setAppConfigInPreload: (data: Record<string, unknown>) => void;
      setCaChainIdpInPreload: (data: string[]) => void;
      httpGet: (url: string, options?: Options) => Promise<TClientRes>;
      httpPost: (url: string, envelope: any, options?: Options) => Promise<TClientRes>;
      getProcessCwd: () => string;
      getProcessEnvs: () => Record<string, string>;
      createLogZipFile: () => Promise<boolean>;
      isP12Valid: (p12Path: string, password: string) => P12_VALIDITY_TYPE;
      extractValidCertificate: (p12Path: string, password: string) => string;
      isMacOS: () => boolean;
      homedir: () => string;
      readLicenceFile: () => string;
      showFilePath(file: File): string;
    };
  }
}
