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
import { IS_DEV } from '@/constants';
import { zip } from 'zip-a-folder';
import { validateMockVersion } from '@/renderer/utils/validate-mock-version';

const { combine, printf, simple, timestamp, splat } = winston.format;

const logLevel = IS_DEV || validateMockVersion() ? 'debug' : 'info';

// get directory path and create it if missing
export const logDirectoryPath = path.join(os.tmpdir(), 'authenticator-logging');

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
  // electron bridge breaks the data structure, we try to log it here properly
  let message = info.message;
  if (Array.isArray(info.message) && info.message.length > 1) {
    message = info.message[0] + '\n  Data: ';
    message += JSON.stringify(info.message.splice(0, 1));
  }

  return `${info.timestamp} [${info.level}]: ${message}${renderExtraData(info)}`;
});

export const logger = createLogger({
  level: logLevel,
  exitOnError: false,
  format: combine(splat(), timestamp(), simple(), myFormat),
  transports: [transport],
});

// If we're not in production then **ALSO** log to the terminal
if (IS_DEV) {
  logger.add(
    new winston.transports.Console({
      format: combine(simple()),
    }),
  );
}

/**
 * Render extra data with error details
 * @param info
 */
const renderExtraData = (info: any) => {
  const cleanInfo = { ...info };
  delete cleanInfo.message;
  delete cleanInfo.level;
  delete cleanInfo.timestamp;

  // return if there is no data
  if (!Object.keys(cleanInfo).length) {
    return '';
  }

  // extract error and print pretty
  let error = '';
  if (cleanInfo.stack) {
    error = `\n  Stack: ${cleanInfo.stack}`;
    delete cleanInfo.stack;
  }

  // return if there is no left data
  if (!Object.keys(cleanInfo).length) {
    return error;
  }

  return `\n  Data: ${JSON.stringify(cleanInfo)}${error}`;
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
