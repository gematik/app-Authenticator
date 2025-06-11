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

import fs from 'fs';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { IS_DEV } from '@/constants';
import { zip } from 'zip-a-folder';
import { TransformableInfo } from 'logform';
import { MainPathProvider } from '@/main/services/main-path-provider';

const { combine, printf, simple } = winston.format;

let logLevel = 'info';
// #!if MOCK_MODE === 'ENABLED'
logLevel = 'debug';
// #!endif

if (!fs.existsSync(MainPathProvider.logDirectoryPath)) {
  fs.mkdirSync(MainPathProvider.logDirectoryPath, { recursive: true });
}

const transport = new winston.transports.DailyRotateFile({
  dirname: MainPathProvider.logDirectoryPath,
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
  const zipLogDirectoryPath = MainPathProvider.genZipLogDirectoryPath(dirPath);
  fs.mkdirSync(dirPath, { recursive: true });
  await zip(MainPathProvider.logDirectoryPath, zipLogDirectoryPath);
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
