/*
 * Copyright 2026, gematik GmbH
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
import path from 'path';
import { logger } from '@/main/services/logging';
import { DEPRECATED_KONNEKTOR_CERTS } from '@/main/services/deprecated-konnektor-certs';

/**
 * Removes deprecated/obsolete Konnektor certificates from the given directory.
 * Used by the macOS copy-from-resources-to-target flow where the target directory
 * is writable.
 *
 * Silently ignores missing files or errors to avoid breaking the app.
 */
export function removeDeprecatedCertificates(targetDir: string): void {
  for (const certName of DEPRECATED_KONNEKTOR_CERTS) {
    const certPath = path.join(targetDir, certName);
    try {
      if (fs.existsSync(certPath)) {
        fs.unlinkSync(certPath);
        logger.info(`Removed deprecated certificate: ${certPath}`);
      }
    } catch (err) {
      logger.warn(`Failed to remove deprecated certificate: ${certPath}. Error: ${(err as Error).message}`);
    }
  }
}
