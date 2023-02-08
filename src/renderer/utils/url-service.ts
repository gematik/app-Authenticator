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
  } else if (args.authz_path && !COMMON_USED_REGEXES.URL.test(args.authz_path!)) {
    error = 'Invalid launch parameters provided';
    message = `Key: challenge_path. Value: ${args.authz_path}`;
    logger.error(`${ERROR_CODES.AUTHCL_0001}: ${error}`, message);
  } else {
    return;
  }

  if (error) {
    throw new UserfacingError(error, message, ERROR_CODES.AUTHCL_0001);
  }
}

/**
 * @param challengePath
 */
export function filterCardTypeFromScope(challengePath: string): { card_type: ECardTypes; challenge_path: string } {
  let cardType, url;
  if (challengePath.includes(SCOPE_ADDITION_HBA)) {
    cardType = ECardTypes.HBA;
    url = challengePath.replace(SCOPE_ADDITION_HBA, '').trimEnd();
    logger.warn('scope hba replaced');
  } else if (challengePath.includes(SCOPE_ADDITION_SMCB)) {
    cardType = ECardTypes.SMCB;
    url = challengePath.replace(SCOPE_ADDITION_SMCB, '').trimEnd();
    logger.warn('scope smcb replaced');
  } else {
    cardType = ECardTypes.HBA;
    url = challengePath;
    logger.warn('No CardType found, use the default cardType "HBA"');
  }
  logger.info('cardType = ' + cardType);
  return { card_type: cardType, challenge_path: url };
}
