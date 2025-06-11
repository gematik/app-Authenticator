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

import os from 'os';
import path from 'path';
import { CONFIG_FILE_NAME } from '@/constants';
import fs from 'fs';
import { SAMPLE_CONFIG_DATA } from '@tests/utils/config-sample-data';

jest.mock('@/renderer/modules/settings/repository', () => {
  // get the original module
  return jest.requireActual('@/renderer/modules/settings/repository');
});

// set env variable
process.env.AUTHCONFIGPATH = path.join(os.homedir(), 'Desktop', 'test-config');
process.env.COMPUTERNAME = 'USER_PC';

describe('default config', () => {
  // before all tests remove AUTHCONFIGPATH dir
  beforeAll(() => {
    // require actual of FileStorageRepository
    jest.resetModules();

    // remove the dir and its content
    if (fs.existsSync(process.env.AUTHCONFIGPATH!)) {
      fs.rmdirSync(process.env.AUTHCONFIGPATH!, { recursive: true });
    }

    // create the dir
    fs.mkdirSync(process.env.AUTHCONFIGPATH!, { recursive: true });
    fs.mkdirSync(path.join(process.env.AUTHCONFIGPATH!, process.env.COMPUTERNAME!), { recursive: true });

    // save the sample data to the default path
    fs.writeFileSync(
      path.join(process.env.AUTHCONFIGPATH!, CONFIG_FILE_NAME),
      JSON.stringify(SAMPLE_CONFIG_DATA, null, 2),
    );

    // save the sample data to the custom path
    fs.writeFileSync(
      path.join(process.env.AUTHCONFIGPATH!, process.env.COMPUTERNAME!, CONFIG_FILE_NAME),
      JSON.stringify(
        {
          ...SAMPLE_CONFIG_DATA,
          customFile: true,
        },
        null,
        2,
      ),
    );
  });

  // after all tests remove AUTHCONFIGPATH dir and load FileStorageRepository mocks again
  afterAll(() => {
    // remove the dir and its content
    if (fs.existsSync(process.env.AUTHCONFIGPATH!)) {
      fs.rmdirSync(process.env.AUTHCONFIGPATH!, { recursive: true });
    }

    jest.resetModules();
  });

  it('reads default and custom path properly', async () => {
    // set process.env as PROCESS_ENV in constants file
    jest.spyOn(window.api, 'sendSync').mockReturnValueOnce(JSON.stringify(process.env));

    // Importing inside the test to ensure we use the original getPath method
    const { FileStorageRepository } = require('@/renderer/modules/settings/repository');

    // gets the custom path as it finds the file
    expect(FileStorageRepository.getPath()).toBe(
      path.join(process.env.AUTHCONFIGPATH!, process.env.COMPUTERNAME!, CONFIG_FILE_NAME),
    );

    // remove the custom config file
    fs.unlinkSync(path.join(process.env.AUTHCONFIGPATH!, process.env.COMPUTERNAME!, CONFIG_FILE_NAME));

    // make  FileStorageRepository._path undefined to force it to calculate the path again
    FileStorageRepository._path = undefined;

    // gets the default path as it can't find the custom file
    expect(FileStorageRepository.getPath()).toBe(path.join(process.env.AUTHCONFIGPATH!, CONFIG_FILE_NAME));
  });
});
