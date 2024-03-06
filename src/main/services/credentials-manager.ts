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
