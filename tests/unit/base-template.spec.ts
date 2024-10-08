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
import BaseTemplate from '@/renderer/components/BaseTemplate.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';

describe('base template screen', () => {
  it('render with settings button', async function () {
    const wrapper = mount(BaseTemplate, {
      global: {
        plugins: [store, i18n],
      },
    });
    expect(wrapper.element).toMatchSnapshot();
  });
});
