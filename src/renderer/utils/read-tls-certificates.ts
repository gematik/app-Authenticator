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

import { PathProvider } from '@/renderer/service/path-provider';
import { logger } from '@/renderer/service/logger';
import swal from 'sweetalert';
import * as errs from '@/renderer/errors/errors';
import { ENTRY_OPTIONS_CONFIG_GROUP, PROXY_SETTINGS_CONFIG } from '@/config';
import i18n from '@/renderer/i18n';

export function readCaCerts(isConnector: boolean): string[] {
  const caCertificatePath = PathProvider.caCertificatePath(isConnector);
  logger.info('caCertificatePath: ' + caCertificatePath);
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
export function getClientCertAndPrivateKeyFilePath(filename: string): string {
  return window.api.pathJoin(PathProvider.configPath, filename);
}

export const copyPemFileToTargetDir = async (
  filePath: string,
  fieldName: string,
  filename: string,
): Promise<string> => {
  // todo this if statement is probably not necessary. Remove later!
  const allowedFiles = [
    ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY,
    ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE,
    PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH,
  ];

  if (!allowedFiles.includes(fieldName)) {
    await swal({
      title: i18n.global.tc('warning'),
      text: i18n.global.tc('selected_file_is_not_compatible_with', { filePath, fieldName }),
      icon: 'warning',
      buttons: {
        cancel: { text: 'OK', value: 0, visible: true },
      },
    });
    throw new errs.AuthenticatorError(`Error: selected file ${filePath} is not in PEM-Format`);
  }
  const targetFileName = getClientCertAndPrivateKeyFilePath(filename);

  try {
    window.api.copyFileSync(filePath, targetFileName);
    logger.info(filePath + ' copied to ' + PathProvider.configPath);
    return targetFileName;
  } catch (err) {
    throw new errs.AuthenticatorError(
      `Error '${err}' occurred while copying file ${filePath} to ${PathProvider.configPath}`,
    );
  }
};
