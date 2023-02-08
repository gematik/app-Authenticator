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

import { CONTEXT_PARAMETERS_CONFIG_GROUP, ENTRY_OPTIONS_CONFIG_GROUP, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';

export const SAMPLE_CONFIG_DATA = {
  [CONTEXT_PARAMETERS_CONFIG_GROUP.MANDANT_ID]: 'Mandant-y',
  [CONTEXT_PARAMETERS_CONFIG_GROUP.CLIENT_ID]: 'Client-System-y',
  [CONTEXT_PARAMETERS_CONFIG_GROUP.WORKPLACE_ID]: 'Arbeitsplatz-y',

  [ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME]: '127.1.1.1',
  [ENTRY_OPTIONS_CONFIG_GROUP.PORT]: 80,

  [ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY]: 'c:/xxx.pem',
  [ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE]: 'c:/yyy.pem',

  [TLS_AUTH_TYPE_CONFIG]: 'ServerCertAuth',

  [MOCK_CONNECTOR_CONFIG]: false,
};

/**
 * Be aware, test file path is not same with production config file!
 */
export const setSampleData = (customData: TRepositoryData = {}) => {
  const fileStorageRepositoryInstance = new FileStorageRepository();
  fileStorageRepositoryInstance.save({ ...SAMPLE_CONFIG_DATA, ...customData });
};

export const clearSampleData = () => {
  const fileStorageRepositoryInstance = new FileStorageRepository();
  fileStorageRepositoryInstance.clear();
};
