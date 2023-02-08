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

import { mount } from '@vue/test-utils';
import { SettingsScreen } from '@/renderer/modules/settings';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { clearSampleData } from '../../../utils/config-sample-data';
import { PathProvider } from '@/renderer/service/path-provider';
import { getHomedir } from '@/renderer/modules/connector/common/utils';

PathProvider.setSystemUserTempPath(getHomedir());

jest.mock('sweetalert', () =>
  jest.fn().mockImplementation(() => {
    return true;
  }),
);

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
    expect(sweetalert).toHaveBeenNthCalledWith(1, {
      buttons: {
        cancel: { text: 'Abbrechen', value: 0, visible: true },
        confirm: { text: 'OK', value: 1, visible: true },
      },
      icon: 'warning',
      text: 'Sind Sie sicher?',
      title: 'Einstellungen werden gespeichert!',
    });

    expect(sweetalert).toHaveBeenNthCalledWith(2, {
      icon: 'error',
      text: 'Bitte stellen Sie sicher, dass das Konfigurationsverzeichnis () existiert und es beschreibbar ist.',
      title: 'Konfigurationsdatei konnte nicht gespeichert werden!',
    });
  });
});
