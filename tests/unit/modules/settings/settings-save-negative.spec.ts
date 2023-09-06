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

jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockReturnValue({ isConfirmed: true }),
}));

import Swal from 'sweetalert2';

import { mount } from '@vue/test-utils';
import { SettingsScreen } from '@/renderer/modules/settings';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { clearSampleData } from '../../../utils/config-sample-data';
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
    const wrapper = await mount(SettingsScreen, {
      global: {
        plugins: [store, i18n],
      },
    });

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
      text: 'Bitte stellen Sie sicher, dass das Konfigurationsverzeichnis () existiert und Sie Schreibrechte darauf haben. Fehlercode (AUTHCL_0008)',
      title: 'Konfigurationsdatei konnte nicht gespeichert werden',
    });
  });
});
