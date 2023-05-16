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

import { Crypto } from '@peculiar/webcrypto';
import { preloadApi } from '@/main/preload-api';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import path from 'path';
import { PRODUCT_NAME } from '@/constants';
import fs from 'fs';
import { clearSampleData } from '../utils/config-sample-data';

// as connector works slowly, we need at least 10 seconds to be sure
jest.setTimeout(10000);

/**
 * Solve crypto problem
 */
Object.defineProperty(global, 'crypto', {
  value: new Crypto(),
});

/**
 * Add missing TextEncoder functionality
 */
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}

jest.mock('electron', () => ({
  ipcRenderer: {
    send: () => {},
    sendSync: () => {},
    on: () => {},
  },
}));

// mock fire function of sweetalert2, it should return a promise with a value {isConfirmed: true}
jest.mock('sweetalert2', () => ({
  fire: () => Promise.resolve({ isConfirmed: true }),
}));

Object.defineProperty(window, 'api', {
  value: preloadApi,
});

// mock path of config for test
const TEST_CONFIG_DIR_PATH = (process.env.APPDATA || process.env.HOME + '/')?.replace('Roaming', 'Local');
const TEST_CONFIG_FILE_NAME = 'test-config.json';
const TEST_CONFIG_FILE_PATH = path.join(TEST_CONFIG_DIR_PATH, PRODUCT_NAME, TEST_CONFIG_FILE_NAME);
fs.mkdirSync(path.join(TEST_CONFIG_DIR_PATH, PRODUCT_NAME), { recursive: true });

jest.spyOn(FileStorageRepository as any, 'path').mockReturnValue(TEST_CONFIG_FILE_PATH);
Object.defineProperty(FileStorageRepository, '_path', { value: TEST_CONFIG_FILE_PATH });

// clear test config file
clearSampleData();
