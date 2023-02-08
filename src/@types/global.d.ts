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

import fs from 'fs';
import url from 'url';
import https from 'https';
import os from 'os';
import util from 'util';
import path from 'path';

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
      httpGet: (
        url: string,
        followRedirect: boolean,
        options?: any,
      ) => Promise<{ data: any; status: number; headers: any }>;
      httpPost: (url: string, envelope: any, options?: any) => Promise<{ data: any; status: number; headers: any }>;
      getProcessCwd: () => string;
      getProcessEnvs: () => Record<string, string>;
    };
  }
}
