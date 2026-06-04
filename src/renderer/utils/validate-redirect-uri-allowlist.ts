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

import { LOCAL_HTTP_SERVER, REDIRECT_URI_APP_NAME_MAPPING } from '@/constants';
import { logger } from '@/renderer/service/logger';

// Registered RP origins, derived once from the known redirect_uri mapping
// (one origin per registered RP). The local sample RP is added only in mock
// builds; the preprocessor strips it from production.
function buildAllowedRedirectOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const redirectUri of Object.keys(REDIRECT_URI_APP_NAME_MAPPING)) {
    try {
      origins.add(new URL(redirectUri).origin);
    } catch {
      // skip a malformed mapping entry
    }
  }
  // #!if MOCK_MODE === 'ENABLED'
  origins.add(new URL(LOCAL_HTTP_SERVER.DEV_ALLOWED_ORIGIN).origin);
  // #!endif
  return origins;
}

const ALLOWED_REDIRECT_ORIGINS = buildAllowedRedirectOrigins();

/**
 * True if `url`'s origin belongs to a registered RP. Gates the error-path
 * fallback that lifts redirect_uri straight from the (attacker-controllable)
 * challenge_path, so an unregistered value can't become an open-redirect 302.
 */
export function isRegisteredRpRedirectUri(url: string): boolean {
  try {
    return ALLOWED_REDIRECT_ORIGINS.has(new URL(url).origin);
  } catch (err) {
    logger.error('Invalid redirect uri for allow-list check', err.message);
    return false;
  }
}
