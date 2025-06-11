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

import keyTar from 'keytar';

import { SENSITIVE_CONFIG_KEYS } from '@/config';
import { logger } from '@/main/services/logging';

export const getSensitiveConfigValues = async () => {
  const returnData: Record<string, string> = {};

  for (const serviceName in SENSITIVE_CONFIG_KEYS) {
    const { accountKey, passwordKey, ignoreAccountKey } = SENSITIVE_CONFIG_KEYS[serviceName];

    const credentialList = await keyTar.findCredentials(serviceName);
    const credentials = credentialList?.[0];

    if (credentials) {
      returnData[passwordKey] = credentials.password.replace(/\x00/g, '');

      if (!ignoreAccountKey) {
        returnData[accountKey] = credentials.account.replace(/\x00/g, '');
      }
    }
  }

  return returnData;
};

export const saveSensitiveConfigValues = async (data: Record<string, string>): Promise<boolean> => {
  logger.info('Saving sensitive config values');

  // remove all sensitive config values from credential store
  // we do not want to keep old credentials around, because if a user changes the account name,
  // we are not able to follow which one is up-to-date one
  for (const serviceName in SENSITIVE_CONFIG_KEYS) {
    // find all saved credentials with findCredentials and delete them
    const credentials = await keyTar.findCredentials(serviceName);
    if (credentials) {
      for (const credential of credentials) {
        await keyTar.deletePassword(serviceName, credential.account);
      }
    }
  }

  let allSavedSuccessfully = true;
  for (const serviceName in SENSITIVE_CONFIG_KEYS) {
    const { accountKey, passwordKey, ignoreAccountKey } = SENSITIVE_CONFIG_KEYS[serviceName];

    const username = ignoreAccountKey ? accountKey : data[accountKey];
    const password = data[passwordKey];

    try {
      if (username && password) {
        await keyTar.setPassword(serviceName, username, password);
      }
    } catch (e) {
      logger.info(`Could not save sensitive config values for service ${serviceName}: ${e.message}`);
      allSavedSuccessfully = false;
    }
  }
  logger.info('Sensitive config values saved');
  return allSavedSuccessfully;
};
