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
    logger.error('Invalid Redirect uri or protocol', err.message);

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
