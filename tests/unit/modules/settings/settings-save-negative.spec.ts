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

import Swal from 'sweetalert2';

import { mount } from '@vue/test-utils';
import { SettingsScreen } from '@/renderer/modules/settings';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { clearSampleData } from '@tests/utils/config-sample-data';
import { PathProvider } from '@/renderer/service/path-provider';
import { getHomedir } from '@/renderer/modules/connector/common/utils';

PathProvider.setSystemUserTempPath(getHomedir());

const fileStorageRepository = new FileStorageRepository();
jest.mock('@/renderer/modules/settings/useSettings.ts', () => ({
  useSettings: () => {
    return fileStorageRepository;
  },
}));

jest.spyOn(FileStorageRepository.prototype, 'save').mockImplementation(() => {
  const message =
    'Config file could not be saved:  ' +
    "Error: ENOENT: no such file or directory, open 'C:\\citrix_configs\\GNDEVXXX\\config.json'";
  throw new Error(message);
});

describe('settings save config', () => {
  afterAll(() => {
    clearSampleData();
  });

  it('catches the save error', async function () {
    const wrapper = mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    jest
      .spyOn(Swal, 'fire')
      .mockResolvedValue({ isConfirmed: true, value: '123456', isDenied: false, isDismissed: false });

    expect(await wrapper.vm.saveConfigValues()).toBe(false);
    expect(Swal.fire).toHaveBeenNthCalledWith(1, {
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'OK',
      icon: 'warning',
      showCancelButton: true,
      text: 'Sind Sie sicher?',
      title: 'Einstellungen werden gespeichert!',
    });

    expect(Swal.fire).toHaveBeenNthCalledWith(2, {
      icon: 'error',
      text: `Bitte stellen Sie sicher, dass das Konfigurationsverzeichnis (${FileStorageRepository.getPath()}) existiert und Sie Schreibrechte darauf haben. Fehlercode (AUTHCL_0008)`,
      title: 'Konfigurationsdatei konnte nicht gespeichert werden',
    });
  });
});
