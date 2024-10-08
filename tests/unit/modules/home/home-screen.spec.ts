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

import { mount } from '@vue/test-utils';
import { HomeScreen } from '@/renderer/modules/home/screens';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';

const fileStorageRepository = new FileStorageRepository();

jest.mock('@/renderer/modules/settings/useSettings.ts', () => ({
  useSettings: () => {
    return fileStorageRepository;
  },
}));

describe('home screen', () => {
  beforeEach(() => {
    fileStorageRepository.clear();
  });

  it('render with settings button', async function () {
    const wrapper = mount(HomeScreen, {
      global: {
        plugins: [store, i18n],
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });

  it('render with loading spinner', async function () {
    await store.commit('setShowLoadingSpinner', true);

    const wrapper = mount(HomeScreen, {
      global: {
        plugins: [store, i18n],
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });
});
