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
jest.spyOn(FileStorageRepository, 'isCentralConfigurationInvalid', 'get').mockReturnValue(true);

/**
 * We want to warn the user if a save attempt is made with an invalid central configuration detected
 * This happens if envs that indicate a central configuration are set but the central configuration file is not found
 * The central configuration file is determined by the env AUTHCONFIGPATH.
 */
describe('settings try save with invalid central config detected', () => {
  afterAll(() => {
    clearSampleData();
  });

  it('shows a warning box on top of the settings screen', async function () {
    const wrapper = mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    const alertBox = wrapper.find('.w-full.bg-yellow-100.border-l-4.border-yellow-500.text-yellow-700.p-4.mb-5');
    expect(alertBox.exists()).toBe(true);
    expect(alertBox.html()).toContain('Es konnte kein gültiger AUTHCONFIGPATH gefunden werden.');
  });

  it('shows a warning modal if one trying to save settings', async function () {
    const wrapper = mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    jest
      .spyOn(Swal, 'fire')
      .mockResolvedValue({ isConfirmed: false, value: '123456', isDenied: false, isDismissed: false });

    expect(await wrapper.vm.saveConfigValues()).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Trotzdem speichern',
      icon: 'warning',
      showCancelButton: true,
      text: 'Es wurde eine Remote Umgebung ohne gültigen AUTHCONFIGPATH erkannt.\nÄnderungen werden lokal gespeichert!\nBitte Konfiguration prüfen.',
      title: 'Remote Umgebung erkannt!',
    });
  });

  it('shows a warning if trying to start the configuration assistant', async function () {
    const wrapper = mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

    jest
      .spyOn(Swal, 'fire')
      .mockResolvedValue({ isConfirmed: false, value: '454325', isDenied: false, isDismissed: false });

    await wrapper.vm.startConfigAssistant();
    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Trotzdem starten',
      icon: 'warning',
      showCancelButton: true,
      text: 'Es wurde eine Remote Umgebung ohne gültigen AUTHCONFIGPATH erkannt.\nÄnderungen durch den Konfigurationsassistenten werden lokal gespeichert!\nBitte Konfiguration prüfen.',
      title: 'Remote Umgebung erkannt!',
    });
  });
});
