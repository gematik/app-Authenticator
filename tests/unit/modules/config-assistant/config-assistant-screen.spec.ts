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
import i18n from '@/renderer/i18n';
import { useRouter } from 'vue-router';
import { ConfigAssistant } from '@/renderer/modules/config-assistant';
import { KONNEKTOR_VENDORS } from '@/@types/common-types';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import store from '@/renderer/store';

jest.mock('vue-router', () => ({
  useRouter: jest.fn(),
}));

const fileStorageRepository = new FileStorageRepository();
jest.mock('@/renderer/modules/settings/useSettings.ts', () => ({
  useSettings: () => {
    return fileStorageRepository;
  },
}));

describe('config assistant screen', () => {
  beforeEach(() => {
    const mockRouter = {};
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  for (const vendor of Object.values(KONNEKTOR_VENDORS)) {
    for (let step = 1; step < 7; step++) {
      // for now every konnektor assistant has 6 steps
      it(`renders ${vendor} assistant step ${step} correctly`, () => {
        const wrapper = mount(ConfigAssistant, {
          global: {
            plugins: [i18n, store],
          },
          props: {
            currentStep: step,
            konnektor: vendor,
          },
        });
        expect(wrapper.element).toMatchSnapshot();
      });
    }
  }
});
