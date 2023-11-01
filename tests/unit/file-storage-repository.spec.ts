import { FileStorageRepository, INITIAL_STATE, TRepositoryData } from '@/renderer/modules/settings/repository';

describe('FileStorageRepository', () => {
  let settingsRepo: FileStorageRepository;

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
