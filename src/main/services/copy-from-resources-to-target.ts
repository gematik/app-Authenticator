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
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '@/main/services/logging';
import { CA_CONNECTOR_DIR_PATH, CA_IDP_DIR_PATH, IS_DEV, TEST_CASES_JSON_FILE_NAME } from '@/constants';
import { copyFileSync } from 'node:original-fs';

const copyFromResourcesToTarget = () => {
  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    return;
  }
  // #!endif

  const APP_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'gematik Authenticator');
  const sourcePathCertsIDP = path.join(__dirname, '..', '..', CA_IDP_DIR_PATH);
  const targetPathCertsIDP = path.join(APP_DIR, CA_IDP_DIR_PATH);
  copyFolderSync(sourcePathCertsIDP, targetPathCertsIDP);

  const sourcePathCertsKonnektor = path.join(__dirname, '..', '..', CA_CONNECTOR_DIR_PATH);
  const targetPathCertsKonnektor = path.join(APP_DIR, CA_CONNECTOR_DIR_PATH);
  copyFolderSync(sourcePathCertsKonnektor, targetPathCertsKonnektor);

  // Copy test cases json file
  copyFileSync(
    path.join(__dirname, '..', '..', TEST_CASES_JSON_FILE_NAME),
    path.join(APP_DIR, TEST_CASES_JSON_FILE_NAME),
  );
};

function copyFolderSync(src: string, dest: string) {
  logger.info(`Copying folder: ${src} -> ${dest}`);

  // If destination folder does not exist, create it.
  if (!fs.existsSync(dest)) {
    logger.info(`Creating destination folder: ${dest}`);
    fs.mkdirSync(dest, { recursive: true });
  }

  // If source folder does not exist, skip.
  if (!fs.existsSync(src)) {
    logger.warn(`Source folder does not exist, skipping: ${src}`);
    return;
  }

  let files: string[] = [];
  try {
    // Read the content of the source folder
    files = fs.readdirSync(src);
  } catch (err) {
    logger.error(`Unable to read folder: ${src}. Error: ${(err as Error).message}`);
    return;
  }

  // If source folder is empty, log it and skip copying
  if (files.length === 0) {
    logger.info(`Source folder is empty: ${src}. Skipping copy operation.`);
    return;
  }

  // Copy files one by one
  for (const file of files) {
    const currentSource = path.join(src, file);
    const currentDest = path.join(dest, file);

    // Optional: Recursively copy if it's a directory. Remove if not needed.
    if (fs.lstatSync(currentSource).isDirectory()) {
      copyFolderSync(currentSource, currentDest);
    } else {
      try {
        logger.info(`Copying file: ${currentSource} -> ${currentDest}`);
        fs.copyFileSync(currentSource, currentDest);
      } catch (err) {
        // Even if there’s an error copying one file, continue with the next.
        logger.error(`Error copying file: ${currentSource} -> ${currentDest}. Error: ${(err as Error).message}`);
      }
    }
  }
}
export default copyFromResourcesToTarget;
