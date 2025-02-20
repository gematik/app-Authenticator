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
 */

/**
 * @jest-environment jsdom
 */
import { logger } from '@/main/services/logging';
import fs from 'fs';
import path from 'path';
import { MainPathProvider } from '@/main/services/main-path-provider';

describe('test winston logger', () => {
  const loggedText = 'Tests log has been successfully written!';

  beforeAll(async () => {
    // delete log file if exists
    if (fs.existsSync(getLogFilePath())) {
      fs.unlinkSync(getLogFilePath());
    }

    // write the log
    logger.info(loggedText);

    // wait for log file changes
    await sleep();
  });

  xit('creates log file properly', function () {
    const logFileExists = fs.existsSync(getLogFilePath());
    expect(logFileExists).toBeTruthy();
  });

  xit('writes log properly', function () {
    const logFileContent = fs.readFileSync(getLogFilePath(), 'utf8');
    expect(logFileContent.includes(loggedText)).toBeTruthy();
  });

  xit('logs error trace properly', async function () {
    try {
      throw new Error('some error text');
    } catch (e) {
      logger.error('Error: ', e, { more: 'even more data' });
      const logFileContent = fs.readFileSync(getLogFilePath(), 'utf8');

      expect(logFileContent.includes('Stack: Error: some error text')).toBeTruthy();
    }
  });

  xit('logs data properly', async function () {
    logger.error('Some important data: ', { code: 'nice code' });

    // wait a second for the log file to be written
    await sleep();
    const logFileContent = fs.readFileSync(getLogFilePath(), 'utf8');

    expect(logFileContent.includes('Data: {\n' + '  "code": "nice code"\n' + '}')).toBeTruthy();
  });

  xit('logs array properly', async function () {
    logger.error('Some important data: ', ['test', 'test2', 'test3']);

    // wait a second for the log file to be written
    await sleep();
    const logFileContent = fs.readFileSync(getLogFilePath(), 'utf8');

    expect(logFileContent.includes('  Data: [\n' + '  "test",\n' + '  "test2",\n' + '  "test3"\n' + ']')).toBeTruthy();
  });

  xit('logs second string properly', async function () {
    const string = 'string';
    logger.error('Some important data: ', string);

    // wait a second for the log file to be written
    await sleep();
    const logFileContent = fs.readFileSync(getLogFilePath(), 'utf8');

    expect(logFileContent.includes('Data: ' + string)).toBeTruthy();
  });
});

function getLogFilePath(): string {
  const date = new Date();
  const day = zeroFill(date.getDate());
  const month = zeroFill(date.getMonth() + 1);
  const fullYear = date.getFullYear();

  const logFileName = `authenticator-${fullYear}-${month}-${day}.log`;
  return path.join(MainPathProvider.logDirectoryPath, logFileName);
}

function zeroFill(i: number): string {
  return (i < 10 ? '0' : '') + i;
}

const sleep = () => new Promise((resolve) => setTimeout(resolve, 3000));
