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

/**
 * @jest-environment jsdom
 */
import { logDirectoryPath, logger } from '@/main/services/logging';
import fs from 'fs';
import path from 'path';

describe('test winston logger', () => {
  const loggedText = 'Tests log has been successfully written!';

  beforeAll(async () => {
    // write the log
    await logger.info(loggedText);

    // wait for log file changes
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  });

  it('creates log file properly', function () {
    const logFileExists = fs.existsSync(getLogFilePath());
    expect(logFileExists).toBeTruthy();
  });

  it('writes log properly', function () {
    const logFileContent = fs.readFileSync(getLogFilePath(), 'utf-8');
    expect(logFileContent.includes(loggedText)).toBeTruthy();
  });

  it('logs error trace properly', async function () {
    try {
      throw new Error('some error text');
    } catch (e) {
      await logger.error('Error: ', e, { more: 'even more data' });
      const logFileContent = fs.readFileSync(getLogFilePath(), 'utf-8');
      logger.info('getLogFilePath:' + fs.readFileSync(getLogFilePath()));
      logger.info('logFileContent:' + logFileContent);

      expect(logFileContent.includes('Stack: Error: some error text')).toBeTruthy();
    }
  });

  it('logs data properly', async function () {
    await logger.error('Some important data: ', { code: 'nice code' });
    const logFileContent = fs.readFileSync(getLogFilePath(), 'utf-8');
    setTimeout(() => {
      expect(logFileContent.includes('Data: {"code":"nice code"}')).toBeTruthy();
    });
  });
});

function getLogFilePath(): string {
  const date = new Date();
  const day = zeroFill(date.getDate());
  const month = zeroFill(date.getMonth() + 1);
  const fullYear = date.getFullYear();

  const logFileName = `authenticator-${fullYear}-${month}-${day}.log`;
  return path.join(logDirectoryPath, logFileName);
}

function zeroFill(i: number): string {
  return (i < 10 ? '0' : '') + i;
}
