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

import { ALLOWED_DEEPLINK_PROTOCOLS } from '@/constants';
import { logger } from '@/renderer/service/logger';

let ALLOWED_PROTOCOLS = ['https:'];
// #!if MOCK_MODE === 'ENABLED'
ALLOWED_PROTOCOLS = ['http:', 'https:'];
// #!endif

/**
 * We only allow http and https protocols to prevent possible vulnerabilities
 * @param url
 */
export function validateRedirectUriProtocol(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
  } catch (err) {
    logger.error('Invalid redirect uri or protocol', err.message);

    return false;
  }
}

export function validateDeeplinkProtocol(url: string): boolean {
  try {
    return ALLOWED_DEEPLINK_PROTOCOLS.includes(url.toLowerCase());
  } catch (err) {
    logger.error('Invalid deeplink protocol', err.message);
    return false;
  }
}
