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

import sweetalert from 'sweetalert';
import fs from 'fs';

import { mount } from '@vue/test-utils';
import { SettingsScreen } from '@/renderer/modules/settings';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { clearSampleData, setSampleData } from '../../../utils/config-sample-data';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';
import { PathProvider } from '@/renderer/service/path-provider';
import { getHomedir } from '@/renderer/modules/connector/common/utils';
import { copyPemFileToTargetDir, getClientCertAndPrivateKeyFilePath } from '@/renderer/utils/read-tls-certificates';
import { UserfacingError } from '@/renderer/errors/errors';
import { checkPemFileFormat, checkPemFileFormatSilent } from '@/renderer/utils/pem-file-validator';
import { PEM_TYPES } from '@/renderer/utils/pem-file-validator';
import { getCaCertsWithFilenames } from '@/renderer/utils/read-tls-certificates';
import { certsValidityTest } from '@/renderer/modules/settings/services/test-cases/certs-validity-test';
import { TestStatus } from '@/renderer/modules/settings/services/test-runner';

PathProvider.setSystemUserTempPath(getHomedir());
const TEST_FILE_PATH_TO_KEY = process.cwd() + '/tests/resources/certs/example/example-key.cer';
const TEST_FILE_PATH = process.cwd() + '/tests/resources/certs/example/example-cer.cer';

const contentKey = fs.readFileSync(TEST_FILE_PATH_TO_KEY);
const contentCert = fs.readFileSync(TEST_FILE_PATH);

jest.mock('sweetalert', () => jest.fn());
const fileStorageRepository = new FileStorageRepository();
jest.mock('@/renderer/modules/settings/useSettings.ts', () => ({
  useSettings: () => {
    return fileStorageRepository;
  },
}));

describe('settings page validation', () => {
  afterAll(() => {
    clearSampleData();
  });

  it('no validation error appears ', async function () {
    setSampleData();
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    expect(wrapper.element?.textContent?.includes('Value is not valid!')).toBeFalsy();
  });

  it('validation error appears ', async function () {
    setSampleData({ [ENTRY_OPTIONS_CONFIG_GROUP.PORT]: 'wrong-port-data' });
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    expect(wrapper.element?.textContent?.includes('Value is not valid!')).toBeTruthy();
  });

  it('validation error blocks saving the form', async function () {
    setSampleData({ [ENTRY_OPTIONS_CONFIG_GROUP.PORT]: 'wrong-port-data' });
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    expect(await wrapper.vm.saveConfigValues()).toBe(false);
    expect(sweetalert).toHaveBeenCalledTimes(1);
    expect(sweetalert).toHaveBeenCalledWith({
      icon: 'warning',
      title: 'Bitte geben Sie einen korrekten Eingabewert ein!',
    });
  });

  it('validation that uploading key and cert files keep their names', async function () {
    fs.mkdirSync(PathProvider.configPath, { recursive: true });
    expect(
      await copyPemFileToTargetDir(TEST_FILE_PATH, ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY, 'example-cer.cer'),
    ).toBe(getClientCertAndPrivateKeyFilePath('example-cer.cer'));

    expect(
      await copyPemFileToTargetDir(TEST_FILE_PATH, ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE, 'example-cer.cer'),
    ).toBe(getClientCertAndPrivateKeyFilePath('example-cer.cer'));
  });

  it('validation that invalid uploading key and cert files throws an error', async function () {
    await expect(copyPemFileToTargetDir(TEST_FILE_PATH, 'wrong entry option', 'example-cer.cer')).rejects.toThrow(
      `Error: selected file ${TEST_FILE_PATH} is not in PEM-Format`,
    );
  });
  const fileKeyString = contentKey.toString();
  const fileCertString = contentCert.toString();

  it('Confirmation that the Key.pem file has the right format.', async function () {
    await expect(checkPemFileFormat(fileKeyString, PEM_TYPES.KEY)).resolves.not.toThrow(UserfacingError);
  });

  it('Confirmation that the Key.pem file throws an error', async function () {
    await expect(checkPemFileFormat('hallo', PEM_TYPES.KEY)).rejects.toThrow(UserfacingError);
  });

  it('Confirmation that the Cert.pem file has the right format.', async function () {
    await expect(checkPemFileFormat(fileCertString, PEM_TYPES.CERT)).resolves.not.toThrow(UserfacingError);
  });

  it('Confirmation that the Cert file throws an error', async function () {
    await expect(checkPemFileFormat('hallo', PEM_TYPES.CERT)).rejects.toThrow(UserfacingError);
  });

  it('Confirmation that the Cert file is valid', async function () {
    await expect(checkPemFileFormatSilent(fileCertString, PEM_TYPES.CERT)).resolves.toBeTruthy();
  });

  it('Confirmation that the Cert file is not valid', async function () {
    await expect(checkPemFileFormatSilent('hallo', PEM_TYPES.CERT)).resolves.toBeFalsy();
  });

  it('There should be some filenames of certs found', async function () {
    await expect(getCaCertsWithFilenames(true).length).toBeGreaterThan(2);
  });

  it('Certs Validity Function Test', async function () {
    const resp = await certsValidityTest();
    expect(resp.status).toBe(TestStatus.success);
  });
});
