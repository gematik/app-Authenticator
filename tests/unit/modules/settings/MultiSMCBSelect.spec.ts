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

import { mount } from '@vue/test-utils';
import SelectSmcbModal from '@/renderer/modules/home/components/SelectSmcbModal.vue';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';

describe('multi-smcb select SelectSmcbModal', () => {
  it('render ', async function () {
    const smcbList = ['demo-a-80276883110000117894', 'demo-b-23232323232323232333'];
    const selectCardPromises = { resolve: Promise.resolve, reject: Promise.reject };

    const wrapper = mount(SelectSmcbModal, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        smcbList: smcbList,
        resolve: selectCardPromises.resolve,
        reject: selectCardPromises.reject,
      } as any,
    });

    expect(wrapper.element).toMatchSnapshot();
  });
});
