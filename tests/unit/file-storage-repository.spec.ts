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

import { FileStorageRepository, INITIAL_STATE, TRepositoryData } from '@/renderer/modules/settings/repository';

describe('FileStorageRepository', () => {
  let settingsRepo: FileStorageRepository;

  beforeAll(() => {
    jest.spyOn(FileStorageRepository as any, 'saveToCm').mockReturnValue(true);
    jest.spyOn(FileStorageRepository as any, 'readFromCm').mockReturnValue({});
  });

  beforeEach(() => {
    settingsRepo = new FileStorageRepository();
  });

  afterEach(() => {
    settingsRepo.clear();
  });

  describe('save', () => {
    it('should save the data to the config file', () => {
      const data: TRepositoryData = { key: 'value', ...INITIAL_STATE };
      settingsRepo.save(data);
      expect(settingsRepo.load()).toEqual(data);
    });
  });

  describe('load', () => {
    it('should load the data from the config file', () => {
      const data: TRepositoryData = { key: 'value', ...INITIAL_STATE };
      settingsRepo.save(data);
      expect(settingsRepo.load()).toEqual(data);
    });

    it('should return an empty object if the config file does not exist', () => {
      settingsRepo.clear();
      expect(settingsRepo.load()).toEqual(INITIAL_STATE);
    });
  });

  describe('clear', () => {
    it('should clear the config file', () => {
      const data: TRepositoryData = { key: 'value' };
      settingsRepo.save(data);
      settingsRepo.clear();
      expect(settingsRepo.exist()).toBe(false);
    });
  });

  describe('exist', () => {
    it('should return true if the config file exists', () => {
      const data: TRepositoryData = { key: 'value' };
      settingsRepo.save(data);
      expect(settingsRepo.exist()).toBe(true);
    });

    it('should return false if the config file does not exist', () => {
      expect(settingsRepo.exist()).toBe(false);
    });
  });

  it('should return true if the config file exists', () => {
    const data: TRepositoryData = { key: 'value', booleanVal: 'true' };
    settingsRepo.save(data);
    const configValues = settingsRepo.load(true);
    expect(configValues.booleanVal).toBe(true);
  });

  describe('setWithoutSave', () => {
    it('should update the cached config', () => {
      const data: TRepositoryData = { key: 'value' };
      settingsRepo.setWithoutSave(data);
      expect(settingsRepo.load()).toEqual(data);
    });
  });
});
