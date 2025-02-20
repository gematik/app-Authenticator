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
