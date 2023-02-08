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

import { Crypto } from '@peculiar/webcrypto';
import { preloadApi } from '@/main/preload-api';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import path from 'path';
import { PRODUCT_NAME } from '@/constants';
import fs from 'fs';
import { clearSampleData } from '../utils/config-sample-data';

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

jest.mock('sweetalert', () => ({}));

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
