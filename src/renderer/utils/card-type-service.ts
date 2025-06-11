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

import { CARD_TYPE_MULTI, ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { SCOPE_ADDITION_HBA, SCOPE_ADDITION_SMCB } from '@/constants';
import { logger } from '@/renderer/service/logger';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';
import { alertDefinedErrorWithDataOptional } from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';

/**
 * @deprecated After every relaying party starts to use the cardType parameter in the challenge_path,
 * this function will be removed!
 * @param challengePath
 */
export function filterCardTypeFromScope(challengePath: string): { card_type: ECardTypes; challenge_path: string } {
  let cardType, url;
  const warningForDeprecatedParameter =
    'Sending Card Type in scope is deprecated. Please use only the cardType parameter in challenge_path instead.';

  if (challengePath.includes(SCOPE_ADDITION_HBA)) {
    cardType = ECardTypes.HBA;
    url = challengePath.replace(SCOPE_ADDITION_HBA, '').trimEnd();
    logger.warn('Scope hba replaced');

    logger.warn(warningForDeprecatedParameter);
  } else if (challengePath.includes(SCOPE_ADDITION_SMCB)) {
    cardType = ECardTypes.SMCB;
    url = challengePath.replace(SCOPE_ADDITION_SMCB, '').trimEnd();
    logger.warn('Scope smcb replaced');

    logger.warn(warningForDeprecatedParameter);
  } else {
    cardType = ECardTypes.HBA;
    url = challengePath;
    logger.warn('No cardType found in scope, use the default cardType "HBA"');

    if (!challengePath.includes('cardType=')) {
      logger.warn('No cardType info found in challenge_path and in scope, please add it to the challenge_path');
    }
  }
  logger.info('cardType = ' + cardType);
  return { card_type: cardType, challenge_path: url };
}

/**
 * @deprecated Extracts the cardType from the SCOPE parameter of the challenge_path
 * This is the old way of sending the cardType information, the first parameter foundCardType is the actual way of
 * getting the cardType information. We need to keep this logic until we be sure that every relay party uses the
 * cardType parameter in the challenge_path.
 *
 * @param foundCardType
 * @param args
 * @param createQueue
 */
export async function getCardTypeFromScope(
  foundCardType: ECardTypes,
  args: TOidcProtocol2UrlSpec,
  createQueue: any,
): Promise<ECardTypes> {
  try {
    const filteredChallengePath = filterCardTypeFromScope(args.challenge_path!);
    let cardType = filteredChallengePath.card_type;

    if (foundCardType) {
      // if cardType is MULTI, that means we have to process the auth flow for both card types
      if (CARD_TYPE_MULTI === foundCardType.toLowerCase()) {
        // start with HBA, and the  SMCB will be processed after the HBA
        cardType = ECardTypes.HBA;

        // replace the cardType parameter with SMCB and add it to the queue
        createQueue(new Event(''), {
          ...args,
          challenge_path: filteredChallengePath.challenge_path.replace(
            'cardType=' + foundCardType,
            'cardType=' + ECardTypes.SMCB,
          ),
        });
      }

      // if cardType exists and suits with ECardTypes, we use it
      else if (Object.values(ECardTypes).includes(foundCardType)) {
        // set the card type from challenge_path
        cardType = foundCardType;
        logger.info('CardType information extracted from challenge_path parameter cardType: ' + cardType);
      } else {
        // parameter isn't compatible with ECardTypes, we take the HBA as default
        logger.error('Wrong card type provided! We take the HBA as the default value.');
      }
    }

    return cardType;
  } catch (e) {
    await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0001);
    throw new AuthFlowError(
      `Error parsing card type in the scope (${ERROR_CODES.AUTHCL_0001})`,
      e.message,
      undefined,
      true,
      OAUTH2_ERROR_TYPE.INVALID_REQUEST,
    );
  }
}
