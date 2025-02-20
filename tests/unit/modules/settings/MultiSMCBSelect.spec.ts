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

import { mount } from '@vue/test-utils';
import MultiCardSelectModal from '@/renderer/modules/gem-idp/components/SelectMultiCardModal.vue';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

describe('multi-smcb select SelectSmcbModal', () => {
  it('render ', async function () {
    const multiCardList = ['demo-SMC-B-a-80276883110000117894', 'demo-SMC-B-b-23232323232323232333'];
    const selectCardPromises = { resolve: Promise.resolve, reject: Promise.reject };

    const wrapper = mount(MultiCardSelectModal, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        multiCardList: multiCardList,
        resolve: selectCardPromises.resolve,
        reject: selectCardPromises.reject,
        selectedCardType: ECardTypes.SMCB,
      } as any,
    });

    expect(wrapper.element).toMatchSnapshot();
  });
});
