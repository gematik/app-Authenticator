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

import { IS_DEV, PROCESS_ENVS } from '@/constants';
import { logger } from '@/renderer/service/logger';

const ALLOWED_PROTOCOLS = IS_DEV || PROCESS_ENVS.MOCK_MODE ? ['http:', 'https:'] : ['https:'];

/**
 * We only allow http and https protocols to prevent possible vulnerabilities
 * @param url
 */
export function validateRedirectUriProtocol(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
  } catch (err) {
    logger.error('Invalid Redirect uri or protocol', err.message);

    return false;
  }
}
