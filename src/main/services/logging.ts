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

import os from 'os';
import fs from 'fs';
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { IS_DEV, LOG_DIRECTORY_NAME, MACOS_PATHS } from '@/constants';
import { zip } from 'zip-a-folder';
import { TransformableInfo } from 'logform';
import { isMacOS } from '@/main/services/utils';

const { combine, printf, simple } = winston.format;

let logLevel = 'info';
// #!if MOCK_MODE === 'ENABLED'
logLevel = 'debug';
// #!endif

// get directory path and create it if missing
const genLogDirPath = isMacOS
  ? path.join(os.homedir(), MACOS_PATHS.LOGGING_DIR, LOG_DIRECTORY_NAME)
  : path.join(os.tmpdir(), LOG_DIRECTORY_NAME);

export const logDirectoryPath = genLogDirPath;

if (!fs.existsSync(logDirectoryPath)) {
  fs.mkdirSync(logDirectoryPath, { recursive: true });
}

const transport = new winston.transports.DailyRotateFile({
  dirname: logDirectoryPath,
  filename: 'authenticator-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '100m', // a file can not be bigger than 100mb
  maxFiles: '14d',
  json: false,
});

const { createLogger } = winston;

/**
 * Custom formatter
 */
const myFormat = printf((info) => {
  const date = new Date();
  const timestamp = date.toLocaleDateString('de') + ' ' + date.toLocaleTimeString('de');

  // if the message is not an array, it is probably main process logging and should be logged as usual
  if (!Array.isArray(info.message)) {
    return `${timestamp} [${info.level}]: ${info.message}${renderExtraData(info)}`;
  }

  // electron bridge breaks the data structure, we try to log it here properly
  return `${timestamp} [${info.level}]: ${info.message[0]}${renderExtraData(info, info.message.slice(1))}`;
});

export const logger = createLogger({
  level: logLevel,
  exitOnError: false,
  format: myFormat,
  transports: [transport],
});

// If we're not in production then **ALSO** log to the terminal

// #!if MOCK_MODE === 'ENABLED'
if (IS_DEV) {
  logger.add(
    new winston.transports.Console({
      format: combine(simple()),
    }),
  );
}
// #!endif

/**
 * Render extra data with error details
 * @param info
 * @param restMessages
 */
const renderExtraData = (info: TransformableInfo, restMessages: any[] = []) => {
  const cleanInfo = { ...info };
  delete cleanInfo.message;
  // @ts-ignore
  delete cleanInfo.level;
  delete cleanInfo.timestamp;

  // extract error and print pretty
  let logText = '';
  if (cleanInfo.stack) {
    logText = `\n  Stack: ${cleanInfo.stack}`;
    delete cleanInfo.stack;
  }

  const symbolForOriginalData = Symbol.for('splat');
  const splatData = restMessages.concat(info[symbolForOriginalData]);

  splatData?.forEach((data: any) => {
    if (typeof data === 'object' || Array.isArray(data)) {
      logText += `\n  Data: ${JSON.stringify(data, null, 2)}`;
      return;
    } else if (typeof data === 'string' || typeof data === 'number') {
      logText += `\n  Data: ${data}`;
      return;
    }
  });

  return logText;
};

/**
 * Creates zip-File of all logs with the npm package 'zip-a-folder'
 * and allows a user selected path
 */
export async function createLogZip(dirPath: string) {
  const zipLogDirectoryPath = path.join(dirPath, 'authenticator-logData_' + getUniqueDateString() + '.zip');
  await zip(logDirectoryPath, zipLogDirectoryPath);
  logger.info('Your Log-Zip-File is here: ' + zipLogDirectoryPath);
}

export function getUniqueDateString() {
  const now = new Date();
  return (
    now.getFullYear() +
    '-' +
    (now.getMonth() + 1) +
    '-' +
    +now.getDate() +
    'T' +
    +now.getHours() +
    '-' +
    +now.getMinutes() +
    '-' +
    +now.getSeconds()
  );
}
