/*
 * Copyright 2024 gematik GmbH
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
  logger.info(`Copying files from ${src} to ${dest}`);
  if (!fs.existsSync(dest)) {
    logger.info(`Creating directory: ${dest}`);
    fs.mkdirSync(dest);
  }
  const files: string[] = fs.readdirSync(src);
  logger.info(`Copying files from ${src} to ${dest}`, files);

  files.forEach((file) => {
    const curSrc: string = path.join(src, file);
    const curDest: string = path.join(dest, file);
    logger.info(`Copying file: ${curSrc}`);
    fs.copyFileSync(curSrc, curDest);
  });
}

export default copyFromResourcesToTarget;
