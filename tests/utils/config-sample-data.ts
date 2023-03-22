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
