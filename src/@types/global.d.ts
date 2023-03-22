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

import fs from 'fs';
import url from 'url';
import https from 'https';
import os from 'os';
import util from 'util';
import path from 'path';
import { Options } from 'got';
import { TClientRes } from '@/main/services/http-client';

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
    };
  }
}
