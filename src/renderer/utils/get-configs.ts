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

import { TConfigObject } from '@/renderer/modules/connector/type-definitions';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { PROXY_AUTH_TYPES } from '@/config';

const FileStorageRepositoryInstance = new FileStorageRepository();

/**
 * @param configGroup
 *
 * return values by prefix
 */
export const getConfigGroup = (configGroup: TConfigObject): TRepositoryData | undefined => {
  const savedConfigValues = FileStorageRepositoryInstance.load();
  const configObject: TRepositoryData = {};

  Object.keys(configGroup).forEach((key: string) => {
    const configKey: string = configGroup[key];
    const configValue = savedConfigValues[<string>configKey];

    if (configValue) {
      const theRealNameOfSetting = getLastPartOfKey(<string>configKey);
      configObject[theRealNameOfSetting] = configValue;
    }
  });

  return configObject;
};

type IConfigValue = string | number | boolean | TLS_AUTH_TYPE | undefined | PROXY_AUTH_TYPES;

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
