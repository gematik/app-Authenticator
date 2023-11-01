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
