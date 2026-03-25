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

import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { ENTRY_OPTIONS_CONFIG_GROUP, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { APP_CONFIG_DATA } from '@/main/preload-api';
import { logger } from '@/main/services/logging';

export function toCertArray(input: string | Buffer | (string | Buffer)[] | undefined): (string | Buffer)[] {
  if (input === undefined) return [];
  if (Array.isArray(input)) return input;
  return [input];
}

/**
 * Electron doesn't allow us to read pfx (p12)-Files in the renderer process.
 * That's why this function is implemented here and not in http-req-config.ts like the function for pem-files.
 */
export const putP12Config = (): { pfx?: Buffer; passphrase?: string } => {
  if (APP_CONFIG_DATA[TLS_AUTH_TYPE_CONFIG] != TLS_AUTH_TYPE.ServerClientCertAuth_Pfx) {
    return {};
  }

  const pfxFile = APP_CONFIG_DATA[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE];
  const pfxPassword = APP_CONFIG_DATA[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD];

  if (pfxFile && typeof pfxFile === 'string') {
    return {
      pfx: fs.readFileSync(pfxFile),
      passphrase: typeof pfxPassword === 'string' ? pfxPassword : undefined,
    };
  } else {
    logger.warn('Missing pfx file for ServerClientCertAuth_Pfx');
    return {};
  }
};
