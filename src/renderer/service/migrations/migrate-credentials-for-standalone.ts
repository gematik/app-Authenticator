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

import { PROCESS_ENVS, STORAGE_CONFIG_KEYS } from '@/constants';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { logger } from '@/renderer/service/logger';

const configFileStoreRepo = new FileStorageRepository();

export const migrateCredentialsForStandalone = async () => {
  const isStandAlone = !PROCESS_ENVS.AUTHCONFIGPATH;
  const isNotMigrated = !localStorage.getItem(STORAGE_CONFIG_KEYS.MIGRATIONS.CREDENTIAL_MANAGER_STANDALONE);

  if (isStandAlone && isNotMigrated) {
    try {
      // save config file to migrate sensitive data from config file to credential manager
      configFileStoreRepo.save(configFileStoreRepo.load());

      // set migration flag
      localStorage.setItem(STORAGE_CONFIG_KEYS.MIGRATIONS.CREDENTIAL_MANAGER_STANDALONE, 'true');
    } catch (e) {
      logger.error('Could not migrate properly, because of the error:', e.message);
    }
  }
};
