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

/**
 * @jest-environment jsdom
 */
import { setSampleData } from '@tests/utils/config-sample-data';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { PROCESS_ENVS, PRODUCT_NAME } from '@/constants';
import { logger } from '@/renderer/service/logger';
import { PathProvider } from '@/renderer/service/path-provider';

jest.spyOn(FileStorageRepository as any, 'saveToCm').mockReturnValue(true);

describe('configMapperByGroup and error handling response', () => {
  beforeEach(() => {
    // clear local storage
    const fileStorageRepository = new FileStorageRepository();
    fileStorageRepository.clear();

    setSampleData();

    // put params in connector store
    ConnectorConfig.updateConnectorParameters();
  });

  it('should set context parameters right', function () {
    expect(ConnectorConfig.contextParameters).toMatchSnapshot();
  });

  it('should set setEntryOptions right', function () {
    expect(ConnectorConfig.tlsEntryOptions).toMatchSnapshot();
  });

  it('should set auth sign params properly', function () {
    expect(ConnectorConfig.authSignParameter).toMatchSnapshot();
  });

  it('should load the config properly', function () {
    const fileStorageRepository = new FileStorageRepository();
    fileStorageRepository.clear();
    const data: TRepositoryData = fileStorageRepository.load();

    logger.info('data:' + data);
  });
});

describe('config file location test', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });
  const existsSyncMock = jest.fn();
  (global as any).window.api.existsSync = existsSyncMock;
  const isFile = jest.fn();
  (global as any).window.api.isFile = isFile;

  // When AUTHCONFIGPATH and COMPUTERNAME but not CLIENTNAME are set, the config-file should be located in AUTHCONFIGPATH + \\ + COMPUTERNAME
  it('test FileStorageRepository-getConfigPath-COMPUTERNAME', async () => {
    process.env.NODE_ENV = 'development';
    PROCESS_ENVS.COMPUTERNAME = 'COMPUTERNAME1';
    PROCESS_ENVS.AUTHCONFIGPATH = 'PATH1';

    existsSyncMock.mockReturnValue(true);
    isFile.mockReturnValue(true);

    const config = FileStorageRepository.getConfigDir();
    expect(config.path).toContain(PROCESS_ENVS.AUTHCONFIGPATH);
    expect(config.path).toContain(PROCESS_ENVS.COMPUTERNAME);
    expect(config.localEnv).toBeFalsy();
  });

  // When AUTHCONFIGPATH and CLIENTNAME are set, the config-file should be located in AUTHCONFIGPATH + \\ + CLIENTNAME
  it('test FileStorageRepository-getConfigPath-CLIENTNAME', async () => {
    process.env.NODE_ENV = 'development';
    PROCESS_ENVS.CLIENTNAME = 'NW001';
    PROCESS_ENVS.COMPUTERNAME = 'COMPUTERNAME1';
    PROCESS_ENVS.AUTHCONFIGPATH = 'PATH1';

    existsSyncMock.mockReturnValue(true);
    isFile.mockReturnValue(true);

    const config = FileStorageRepository.getConfigDir();

    expect(config.path).toContain(PROCESS_ENVS.AUTHCONFIGPATH);
    expect(config.path).toContain(PROCESS_ENVS.CLIENTNAME);
    expect(config.localEnv).toBeFalsy();
  });

  // When AUTHCONFIGPATH and VIEWCLIENT_MACHINE_NAME are set, the config-file should be located in AUTHCONFIGPATH + \\ + VIEWCLIENT_MACHINE_NAME
  it('test FileStorageRepository-getConfigPath-VIEWCLIENT_MACHINE_NAME', async () => {
    //process.env.NODE_ENV = 'development';
    PROCESS_ENVS.VIEWCLIENT_MACHINE_NAME = 'NW001';
    PROCESS_ENVS.COMPUTERNAME = 'COMPUTERNAME1';
    PROCESS_ENVS.AUTHCONFIGPATH = 'PATH1';

    existsSyncMock.mockReturnValue(true);
    isFile.mockReturnValue(true);

    const config = FileStorageRepository.getConfigDir();

    expect(config.path).toContain(PROCESS_ENVS.AUTHCONFIGPATH);
    expect(config.path).toContain(PROCESS_ENVS.VIEWCLIENT_MACHINE_NAME);
    expect(config.localEnv).toBeFalsy();
  });

  // When AUTHCONFIGPATH and CLIENTNAME are set but no config.json was found, the specified path should still be used.
  // Because then the user has to create a new config-file which should be saved in the specified path
  it('test FileStorageRepository-getConfig-NotExists', async () => {
    process.env.NODE_ENV = 'development';
    PROCESS_ENVS.CLIENTNAME = 'NW001';
    PROCESS_ENVS.COMPUTERNAME = 'COMPUTERNAME1';
    PROCESS_ENVS.AUTHCONFIGPATH = 'PATH1';

    existsSyncMock.mockReturnValue(true);
    isFile.mockReturnValue(false);

    const config = FileStorageRepository.getConfigDir();

    expect(config.path).toContain(PROCESS_ENVS.AUTHCONFIGPATH);
    expect(config.path).toContain(PROCESS_ENVS.CLIENTNAME);
    expect(config.localEnv).toBeFalsy();
  });

  it("should return the expected config path. When TEMP-Path contains 'temp' in configPath should be only left part of string", () => {
    const expectedPath = 'C:\\Users\\username\\AppData\\Roaming\\' + PRODUCT_NAME;
    const getSystemUserTempPathSpy = jest
      .spyOn(PathProvider, 'getSystemUserTempPath')
      .mockReturnValue('C:\\Users\\username\\AppData\\Local\\Temp');
    // @ts-ignore
    const pathJoinSpy = jest.spyOn(window.api, 'pathJoin').mockReturnValue(expectedPath);

    const actualPath = PathProvider.configPath;

    expect(getSystemUserTempPathSpy).toHaveBeenCalled();
    expect(pathJoinSpy).toHaveBeenCalledWith('c:\\users\\username\\appdata\\local\\', PRODUCT_NAME);
    expect(actualPath).toEqual('C:\\Users\\username\\AppData\\Roaming\\' + PRODUCT_NAME);

    getSystemUserTempPathSpy.mockRestore();
    pathJoinSpy.mockRestore();
  });
});
