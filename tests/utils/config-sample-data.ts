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

import {
  CONTEXT_PARAMETERS_CONFIG_GROUP,
  ENTRY_OPTIONS_CONFIG_GROUP,
  PROXY_SETTINGS_CONFIG,
  TLS_AUTH_TYPE_CONFIG,
} from '@/config';
import { MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';
import dotObject from 'dot-object';
import { TLS_AUTH_TYPE } from '@/@types/common-types';

export const SAMPLE_CONFIG_DATA = {
  [CONTEXT_PARAMETERS_CONFIG_GROUP.MANDANT_ID]: 'Mandant-y',
  [CONTEXT_PARAMETERS_CONFIG_GROUP.CLIENT_ID]: 'Client-System-y',
  [CONTEXT_PARAMETERS_CONFIG_GROUP.WORKPLACE_ID]: 'Arbeitsplatz-y',

  [ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME]: '127.1.1.1',
  [ENTRY_OPTIONS_CONFIG_GROUP.PORT]: 80,

  [ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY]: 'c:/xxx.pem',
  [ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE]: 'c:/yyy.pem',

  [TLS_AUTH_TYPE_CONFIG]: TLS_AUTH_TYPE.ServerCertAuth,

  [MOCK_CONNECTOR_CONFIG]: false,
  [PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS]: true,
};

export const SAMPLE_CONFIG_DATA_STRUCTURED = dotObject.object(SAMPLE_CONFIG_DATA);

/**
 * Be aware, the test file path is different from production config file!
 */
export const setSampleData = (customData: TRepositoryData = {}) => {
  const fileStorageRepositoryInstance = new FileStorageRepository();
  fileStorageRepositoryInstance.save({ ...SAMPLE_CONFIG_DATA, ...customData });
};

export const clearSampleData = () => {
  const fileStorageRepositoryInstance = new FileStorageRepository();
  fileStorageRepositoryInstance.clear();
};
