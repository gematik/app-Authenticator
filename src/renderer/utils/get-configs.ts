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

import { TConfigObject } from '@/renderer/modules/connector/type-definitions';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';

const FileStorageRepositoryInstance = new FileStorageRepository();

/**
 * @param configGroup
 *
 * return values by prefix
 */
export const getConfigGroup = (configGroup: TConfigObject): any | undefined => {
  const savedConfigValues = FileStorageRepositoryInstance.load();
  const configObject: TConfigObject = {};

  Object.keys(configGroup).forEach((key: string) => {
    const configKey = configGroup[key];
    const configValue = savedConfigValues[<string>configKey];

    if (configValue) {
      const theRealNameOfSetting = getLastPartOfKey(<string>configKey);
      configObject[theRealNameOfSetting] = configValue;
    }
  });

  return configObject;
};

type IConfigValue = string | number | boolean;
/**
 * read and return single parameter
 * @param key
 * @param defaultValue<>
 */
export const getConfig = (key: string, defaultValue?: IConfigValue): { value: IConfigValue; name: string } => {
  const savedConfigValues = FileStorageRepositoryInstance.load();

  return {
    value: savedConfigValues[key] ?? defaultValue,
    name: getLastPartOfKey(key),
  };
};

/**
 * returns the last part of point split key
 * @param key
 */
const getLastPartOfKey = (key: string): string => {
  const parsedKey = key.split('.');
  const lastKey = parsedKey.pop();

  if (lastKey) {
    return lastKey;
  }

  // this error will probably never occur in production but can be helpful for developers to understand their mistake!
  throw Error('Invalid key. Please be sure that your key has a string after last dot.');
};
