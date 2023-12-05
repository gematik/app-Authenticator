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
  let allSavedSuccessfully = true;
  for (const serviceName in SENSITIVE_CONFIG_KEYS) {
    const { accountKey, passwordKey, ignoreAccountKey } = SENSITIVE_CONFIG_KEYS[serviceName];

    const username = ignoreAccountKey ? accountKey : data[accountKey];
    const password = data[passwordKey];

    try {
      if (username && password) {
        await keyTar.setPassword(serviceName, username, password);
      } else if (username && !password) {
        await keyTar.deletePassword(serviceName, username);
      }
    } catch (e) {
      logger.info(`Could not save sensitive config values for service ${serviceName}: ${e.message}`);
      allSavedSuccessfully = false;
    }
  }
  logger.info('Sensitive config values saved');
  return allSavedSuccessfully;
};
