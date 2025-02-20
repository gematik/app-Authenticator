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
