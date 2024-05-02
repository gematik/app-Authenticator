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

import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { COMMON_USED_REGEXES, SCOPE_ADDITION_HBA, SCOPE_ADDITION_SMCB } from '@/constants';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';
import { ERROR_CODES } from '@/error-codes';
import { UserfacingError } from '@/renderer/errors/errors';
import { logger } from '@/renderer/service/logger';

/**
 * Check launcher arguments, some of them are required for the auth flow
 * @param args
 */
export function validateLauncherArguments(args: TOidcProtocol2UrlSpec): void {
  let error = '';
  let message = '';

  if (args.challenge_path && !COMMON_USED_REGEXES.URL.test(args.challenge_path)) {
    error = 'Invalid launch parameters provided';
    message = `Key: challenge_path. Value: ${args.challenge_path}`;
    logger.error(`${ERROR_CODES.AUTHCL_0001}: ${error}`, message);
  } else {
    return;
  }

  if (error) {
    throw new UserfacingError(error, message, ERROR_CODES.AUTHCL_0001);
  }
}

/**
 * @deprecated use popParamFromChallengePath instead
 * @param challengePath
 */
export function filterCardTypeFromScope(challengePath: string): { card_type: ECardTypes; challenge_path: string } {
  let cardType, url;
  const warningForDeprecatedParameter =
    'Sending Card Type in scope is deprecated. Please use only the cardType parameter in challenge_path instead.';

  if (challengePath.includes(SCOPE_ADDITION_HBA)) {
    cardType = ECardTypes.HBA;
    url = challengePath.replace(SCOPE_ADDITION_HBA, '').trimEnd();
    logger.warn('scope hba replaced');

    logger.warn(warningForDeprecatedParameter);
  } else if (challengePath.includes(SCOPE_ADDITION_SMCB)) {
    cardType = ECardTypes.SMCB;
    url = challengePath.replace(SCOPE_ADDITION_SMCB, '').trimEnd();
    logger.warn('scope smcb replaced');

    logger.warn(warningForDeprecatedParameter);
  } else {
    cardType = ECardTypes.HBA;
    url = challengePath;
    logger.warn('No CardType found in scope, use the default cardType "HBA"');

    if (!challengePath.includes('cardType=')) {
      logger.warn('No cardType info found in challenge_path and in scope, please add it to the challenge_path');
    }
  }
  logger.info('cardType = ' + cardType);
  return { card_type: cardType, challenge_path: url };
}
