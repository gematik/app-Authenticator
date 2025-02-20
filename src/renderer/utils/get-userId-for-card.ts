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
 */

import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { STORAGE_CONFIG_KEYS } from '@/constants';
import { logger } from '@/renderer/service/logger';

/**
 * Returns userId for unique card.
 * @param cardId
 */
export const getUserIdForCard = (cardId: string): string => {
  const hashedCardId = getHashForCardID(cardId);
  const storedUserId = localStorage.getItem(STORAGE_CONFIG_KEYS.HBA_CARD_USER_ID + hashedCardId);

  if (storedUserId) {
    // userID available in local storage => use this

    return storedUserId;
  } else {
    // nothing stored in local storage, create a new one and write this to local storage
    return generateAndSaveUserId(hashedCardId);
  }
};

/**
 * generates, saves and returns a unique ID
 */
export const generateAndSaveUserId = (hashedCardId: string): string => {
  const UniqueID = uuidv4();
  logger.debug('generateUniqueID, userId: ' + UniqueID);

  localStorage.setItem(STORAGE_CONFIG_KEYS.HBA_CARD_USER_ID + hashedCardId, UniqueID);

  return UniqueID;
};

/**
 * generates a hash value for each cardID
 */
const getHashForCardID = (cardId: string): string => {
  return createHash('sha256').update(cardId).digest('hex');
};
