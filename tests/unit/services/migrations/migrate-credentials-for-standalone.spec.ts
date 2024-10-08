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

import { migrateCredentialsForStandalone } from '@/renderer/service/migrations/migrate-credentials-for-standalone';
import { PROCESS_ENVS, STORAGE_CONFIG_KEYS } from '@/constants';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';

jest.spyOn(FileStorageRepository.prototype as any, 'load').mockReturnValue({});
jest.spyOn(FileStorageRepository.prototype as any, 'save').mockReturnValue({});

describe('migrateCredentialsForStandalone', () => {
  let originalLocalStorage: any;
  let mockLocalStorage: any;

  beforeEach(() => {
    // Setup mock localStorage
    originalLocalStorage = global.localStorage;
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    global.localStorage = mockLocalStorage;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
  });

  it('should migrate credentials if running in standalone mode and not yet migrated', async () => {
    // Mock environment and localStorage conditions
    PROCESS_ENVS.AUTHCONFIGPATH = '';
    mockLocalStorage.getItem.mockReturnValueOnce(null); // simulate migration flag not set

    await migrateCredentialsForStandalone();

    expect(FileStorageRepository.prototype.save).toHaveBeenCalledTimes(1);
    expect(FileStorageRepository.prototype.load).toHaveBeenCalledTimes(1);
  });

  it('should not migrate credentials if already migrated', async () => {
    // Mock environment and localStorage conditions
    PROCESS_ENVS.AUTHCONFIGPATH = '';
    mockLocalStorage.getItem.mockReturnValueOnce('true'); // simulate migration flag already set

    await migrateCredentialsForStandalone();

    expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
      STORAGE_CONFIG_KEYS.MIGRATIONS.CREDENTIAL_MANAGER_STANDALONE,
      'true',
    );
    expect(FileStorageRepository.prototype.save).not.toHaveBeenCalled();
  });

  it('should not migrate credentials if not in standalone mode', async () => {
    // Mock environment and localStorage conditions
    PROCESS_ENVS.AUTHCONFIGPATH = 'somePath';
    mockLocalStorage.getItem.mockReturnValueOnce(null); // simulate migration flag not set

    await migrateCredentialsForStandalone();

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(FileStorageRepository.prototype.save).not.toHaveBeenCalled();
  });
});
