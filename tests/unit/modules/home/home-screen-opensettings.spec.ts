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

import { mount } from '@vue/test-utils';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import Swal from 'sweetalert2';
import OpenSettings from '@/renderer/modules/home/components/OpenSettings.vue';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import router from '@/renderer/router';

const fileStorageRepository = new FileStorageRepository();
jest.mock('@/renderer/modules/settings/useSettings.ts', () => ({
  useSettings: () => {
    return fileStorageRepository;
  },
}));
jest.spyOn(FileStorageRepository, 'isCentralConfigurationInvalid', 'get').mockReturnValue(true);
jest.spyOn(FileStorageRepository, 'isNewInstallation', 'get').mockReturnValue(true);

describe('home screen -> open settings', () => {
  it('shows a warning if trying to start the configuration assistant from home screen with faulty central config', async function () {
    const wrapper = mount(OpenSettings, {
      global: {
        plugins: [store, i18n, router],
      },
    });

    jest
      .spyOn(Swal, 'fire')
      .mockResolvedValue({ isConfirmed: false, value: '454325', isDenied: false, isDismissed: false });

    const vm = wrapper.vm as unknown as { startConfigAssistant: () => Promise<void> };

    await vm.startConfigAssistant();

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
