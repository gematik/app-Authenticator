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

import { mount, RouterLinkStub } from '@vue/test-utils';
import { useRoute } from 'vue-router';
import BaseTemplate from '@/renderer/components/BaseTemplate.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import * as settings from '@/renderer/modules/settings/useSettings';

jest.mock('vue-router', () => ({
  useRoute: jest.fn(),
}));

jest.spyOn(settings, 'useSettings').mockReturnValue({
  save: jest.fn(),
  clear: jest.fn(),
  load: jest.fn(),
  exist: jest.fn(),
  setWithoutSave: jest.fn(),
});

// Type assertion to treat useRoute as a Jest mock function
const mockedUseRoute = useRoute as jest.Mock;

describe('base template screen', () => {
  beforeEach(() => {
    mockedUseRoute.mockReset();
  });

  it('renders with settings button', async () => {
    const mockRoute = {
      path: '/mock-path',
      name: 'mock-route',
      params: {},
      query: {},
    };
    mockedUseRoute.mockReturnValue(mockRoute);

    const wrapper = mount(BaseTemplate, {
      global: {
        plugins: [store, i18n],
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    expect(wrapper.element).toMatchSnapshot();
  });
});
