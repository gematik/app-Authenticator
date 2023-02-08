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
