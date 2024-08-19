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

import { P12_VALIDITY_TYPE } from '@/constants';
import Swal from 'sweetalert2';
import fs from 'fs';

import { mount } from '@vue/test-utils';
import { SettingsScreen } from '@/renderer/modules/settings';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { clearSampleData, setSampleData } from '@tests/utils/config-sample-data';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';
import { PathProvider } from '@/renderer/service/path-provider';
import { getHomedir } from '@/renderer/modules/connector/common/utils';
import {
  copyUploadedFileToTargetDir,
  getCaCertsWithFilenames,
  getUploadedFilePath,
} from '@/renderer/utils/read-tls-certificates';
import { UserfacingError } from '@/renderer/errors/errors';
import { checkPemFileFormat, checkPemFileFormatSilent, PEM_TYPES } from '@/renderer/utils/pem-file-validator';
import { certsValidityTest } from '@/renderer/modules/settings/services/test-cases/certs-validity-test';
import { TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { preloadApi } from '@/main/preload-api';
import { isMacOS } from '@tests/utils';
import os from 'os';

jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockReturnValue({ isConfirmed: true }),
}));

PathProvider.setSystemUserTempPath(getHomedir());
const TEST_FILE_PATH_TO_KEY = process.cwd() + '/tests/resources/certs/example/example-key.cer';
const TEST_FILE_PATH = process.cwd() + '/tests/resources/certs/example/example-cer.cer';
const TEST_FILE_PATH_PFX = process.cwd() + '/tests/resources/certs/example/cs0001.p12';
const TEST_FILE_PATH_ONLY_ECC_PFX = process.cwd() + '/tests/resources/certs/example/cs0001_ECC.p12';
const TEST_FILE_PATH_OUTDATED_PFX = process.cwd() + '/tests/resources/certs/example/smcb-idp-expired.p12';
const TEST_FILE_PATH_INVALID_AND_EMPTY_PFX =
  process.cwd() + '/tests/resources/certs/example/cert_invalid_and_empty.p12';
const TEST_FILE_PATH_RSA_AND_ECC_PFX = process.cwd() + '/tests/resources/certs/example/cs0001_RSA_ECC.p12';
const TEST_FILE_PATH_WITH_TOO_MANY_PFX = process.cwd() + '/tests/resources/certs/example/cert_with_more_than_one_rsa';
const TEST_FILE_PATH_EMPTY_PFX = process.cwd() + '/tests/resources/certs/example/cert_empty';

const contentKey = fs.readFileSync(TEST_FILE_PATH_TO_KEY);
const contentCert = fs.readFileSync(TEST_FILE_PATH);

jest.spyOn(FileStorageRepository as any, 'saveToCm').mockReturnValue(true);

if (isMacOS()) {
  jest.spyOn(window.api, 'sendSync').mockReturnValue(os.homedir());
}

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

  const valueNotValidText = 'Wert ist nicht gültig!';
  it('no validation error appears ', async function () {
    setSampleData();
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    expect(wrapper.element?.textContent?.includes(valueNotValidText)).toBeFalsy();
  });

  it('validation error appears ', async function () {
    // @ts-ignore
    setSampleData({ [ENTRY_OPTIONS_CONFIG_GROUP.PORT]: 'wrong-port-data' });
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    expect(wrapper.element?.textContent?.includes(valueNotValidText)).toBeTruthy();
  });

  it('validation error blocks saving the form', async function () {
    jest
      .spyOn(Swal, 'fire')
      .mockResolvedValue({ isConfirmed: true, value: '123456', isDenied: false, isDismissed: false });

    // @ts-ignore
    setSampleData({ [ENTRY_OPTIONS_CONFIG_GROUP.PORT]: 'wrong-port-data' });
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    expect(await wrapper.vm.saveConfigValues()).toBe(false);
    expect(Swal.fire).toHaveBeenCalledTimes(1);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: 'warning',
      title: 'Bitte geben Sie einen korrekten Eingabewert ein!',
      confirmButtonText: 'OK',
    });
  });

  it('validation that uploading key and cert files keep their names', async function () {
    fs.mkdirSync(PathProvider.configPath, { recursive: true });
    expect(
      await copyUploadedFileToTargetDir(TEST_FILE_PATH, ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY, 'example-cer.cer'),
    ).toBe(getUploadedFilePath('example-cer.cer'));

    expect(
      await copyUploadedFileToTargetDir(TEST_FILE_PATH, ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE, 'example-cer.cer'),
    ).toBe(getUploadedFilePath('example-cer.cer'));
  });

  it('validation that invalid uploading key and cert files throws an error', async function () {
    /* @ts-ignore this is a negative test*/
    await expect(copyUploadedFileToTargetDir(TEST_FILE_PATH, 'wrong entry option', 'example-cer.cer')).rejects.toThrow(
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
  it('Negative - Certs Validity Function Test', async function () {
    // create one invalid cert in the PathProvider.caCertificatePath(isConnector) folder
    const caCertificatePath = PathProvider.caCertificatePath(false);
    const invalidCertPath = caCertificatePath + '/invalid_cert.pem';
    fs.writeFileSync(invalidCertPath, 'invalid cert content');

    try {
      const resp = await certsValidityTest();
      console.log('custom resp', resp);
      expect(resp.details).toBe(
        'Es wurden insgesamt 29 Zertifikate gefunden, davon 1 fehlerhaft. Bitte überprüfen Sie die folgenden Zertifikate: <br>- invalid_cert.pem',
      );
    } catch (e) {
      console.log('custom error', e);
      expect(e).toBe('Test failed');
    } finally {
      // remove the invalid cert
      fs.unlinkSync(invalidCertPath);
    }
  });
  it('validation that uploading pfx-file keep their name', async function () {
    fs.mkdirSync(PathProvider.configPath, { recursive: true });
    expect(
      await copyUploadedFileToTargetDir(
        TEST_FILE_PATH_PFX,
        ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE,
        'cs0001.p12',
      ),
    ).toBe(getUploadedFilePath('cs0001.p12'));
  });
  it('validation that valid uploading pfx-file is successful', async function () {
    expect(preloadApi.isP12Valid(TEST_FILE_PATH_PFX, '123456')).toBe(P12_VALIDITY_TYPE.VALID);
  });
  it('validation that outdated uploading pfx-file throws an error', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_OUTDATED_PFX, '00')).toBe(P12_VALIDITY_TYPE.INVALID_CERTIFICATE);
  });
  it('validation that uploading a pfx-file with wrong password throws an error', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_PFX, 'wrong password')).toBe(P12_VALIDITY_TYPE.WRONG_PASSWORD);
  });
  it('validation that invalid uploading pfx-file throws an error', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_ONLY_ECC_PFX, '123456')).toBe(
      P12_VALIDITY_TYPE.INVALID_CERTIFICATE,
    );
  });
  it('validation that an invalid/empty uploading pfx-file throws an error', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_INVALID_AND_EMPTY_PFX, '')).toBe(
      P12_VALIDITY_TYPE.PROCESSING_EXCEPTION,
    );
  });
  it('validation that an pfx-file with one valid and invalid certs throws a hint', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_RSA_AND_ECC_PFX, '123456')).toBe(
      P12_VALIDITY_TYPE.ONE_VALID_AND_INVALID_CERTIFICATES,
    );
  });
  it('validation that an pfx-file with more than one valid certs throws an error', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_WITH_TOO_MANY_PFX, '123456')).toBe(
      P12_VALIDITY_TYPE.TOO_MANY_CERTIFICATES,
    );
  });
  it('validation that an empty pfx-file throws an error', async function () {
    await expect(preloadApi.isP12Valid(TEST_FILE_PATH_EMPTY_PFX, '123456')).toBe(P12_VALIDITY_TYPE.NO_CERT_FOUND);
  });
});
