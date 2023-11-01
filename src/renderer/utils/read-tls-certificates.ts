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

import { PathProvider } from '@/renderer/service/path-provider';
import { logger } from '@/renderer/service/logger';
import Swal from 'sweetalert2';
import * as errs from '@/renderer/errors/errors';
import { ENTRY_OPTIONS_CONFIG_GROUP, PROXY_SETTINGS_CONFIG } from '@/config';
import i18n from '@/renderer/i18n';

export function readCaCerts(isConnector: boolean): string[] {
  const caCertificatePath = PathProvider.caCertificatePath(isConnector);
  const certs = window.api.readdirSync(caCertificatePath);

  logger.debug('certificates found in ProgramFolder: ' + caCertificatePath, { certsCount: certs?.length });
  return certs
    .filter((fileName) => window.api.isFile(window.api.pathJoin(caCertificatePath, fileName)))
    .map((fileName) => window.api.readFileSync(window.api.pathJoin(caCertificatePath, fileName), 'utf-8'));
}

export function getCaCertsWithFilenames(isConnector: boolean): { name: string; cert: string }[] {
  const caCertificatePath = PathProvider.caCertificatePath(isConnector);
  return window.api
    .readdirSync(caCertificatePath)
    .filter((fileName) => window.api.isFile(window.api.pathJoin(caCertificatePath, fileName)))
    .map((fileName) => ({
      name: fileName,
      cert: window.api.readFileSync(window.api.pathJoin(caCertificatePath, fileName), 'utf-8'),
    }));
}

export function getUploadedFilePath(filename: string): string {
  return window.api.pathJoin(PathProvider.configPath, filename);
}

export const copyUploadedFileToTargetDir = async (
  filePath: string,
  fieldName: string,
  filename: string,
): Promise<string> => {
  // todo this if statement is probably not necessary. Remove later!
  const allowedFiles = [
    ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY,
    ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE,
    ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD,
    ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE,
    PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH,
  ];

  if (!allowedFiles.includes(fieldName)) {
    await Swal.fire({
      title: i18n.global.t('warning'),
      text: i18n.global.t('selected_file_is_not_compatible_with', { filePath, fieldName }),
      icon: 'warning',
      showCancelButton: true,
    });
    throw new errs.AuthenticatorError(`Error: selected file ${filePath} is not in PEM-Format`);
  }
  const targetFileName = getUploadedFilePath(filename);

  try {
    window.api.copyFileSync(filePath, targetFileName);
    logger.info(filePath + ' copied to ' + PathProvider.configPath);
    return targetFileName;
  } catch (err) {
    // todo add swal warning
    throw new errs.AuthenticatorError(
      `Error '${err}' occurred while copying file ${filePath} to ${PathProvider.configPath}`,
    );
  }
};
