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

// as the connector works slowly, we need at least 10 seconds to be sure
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

// @ts-ignore
Object.defineProperty(window, 'api', {
  value: preloadApi,
});

// mock path of config for test
const TEST_CONFIG_DIR_PATH = (process.env.APPDATA || process.env.HOME + '/')?.replace('Roaming', 'Local');
const TEST_CONFIG_FILE_NAME = 'test-config.json';
const TEST_CONFIG_FILE_PATH = path.join(TEST_CONFIG_DIR_PATH, PRODUCT_NAME, TEST_CONFIG_FILE_NAME);
fs.mkdirSync(path.join(TEST_CONFIG_DIR_PATH, PRODUCT_NAME), { recursive: true });

jest.spyOn(FileStorageRepository as any, 'getPath').mockReturnValue(TEST_CONFIG_FILE_PATH);
Object.defineProperty(FileStorageRepository, '_path', { value: TEST_CONFIG_FILE_PATH });

// clear test config file
clearSampleData();

// @ts-ignore
global.setImmediate = jest.fn().mockImplementation((callback: any) => callback());

/**
 * Fail a test with a reason.
 * @param reason
 */
function fail(reason = 'fail was called in a test.') {
  throw new Error(reason);
}

// @ts-ignore
global.fail = fail;

export const mockKeyTar = async (
  setPasswordWasSuccessful = true,
  deletePasswordWasSuccessful = true,
  findCredentials = [],
) => {
  jest.mock('keytar', () => ({
    findCredentials: jest.fn().mockResolvedValue(findCredentials),
    setPassword: jest.fn().mockResolvedValue(setPasswordWasSuccessful),
    deletePassword: jest.fn().mockResolvedValue(deletePasswordWasSuccessful),
  }));
};

// mock window.api.existsSync and return true
export const mockExistsSync = (value = false) => {
  // @ts-ignore
  jest.spyOn(window.api, 'existsSync').mockReturnValue(value);
};

export const mockReadFileSync = (data = {}) => {
  // @ts-ignore return stored data in buffer
  jest.spyOn(window.api, 'readFileSync').mockReturnValue(Buffer.from(JSON.stringify(data), 'utf-8'));
};
