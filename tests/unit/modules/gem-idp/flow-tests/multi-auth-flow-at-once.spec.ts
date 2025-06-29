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
import { shallowMount } from '@vue/test-utils';
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { logger } from '@/renderer/service/logger';
import router from '@/renderer/router';
import { createRouter, createWebHistory } from 'vue-router';
import Swal from 'sweetalert2';

// prevent over logging
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'debug').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});

jest.spyOn(Swal, 'fire').mockImplementation(() => {
  throw new Error('stop the flow');
});

describe('AuthFlow multi-auth-flow-at-once.spec.ts', () => {
  const wrapper = shallowMount(AuthFlow, {
    global: {
      plugins: [store, i18n],
      mocks: {
        $router: createRouter({
          history: createWebHistory(),
          routes: router.getRoutes(),
        }),
      },
    },
  });

  // mock parseAndSetIdpHost and throw an error
  (wrapper.vm.$refs.idpActionsComponent as any).parseAuthArguments = jest.fn().mockImplementation(() => {
    throw new Error('stop the flow');
  });

  // we need to mock  this external function which gets called in finishAndStartNextFlow
  // to prevent the flow from continuing
  (wrapper.vm.$refs.pinActionsComponent as any).resetVerifyPinClose = jest.fn().mockImplementation(() => {
    return false;
  });

  // if we throw error in the try block, it keeps on in the catch block
  // that's why we need to stop also the flow in the catch block
  wrapper.vm.sendAuthorizationRequest = jest.fn().mockImplementation(() => {
    throw new Error('stop the flow');
  });

  // Define test arguments
  const args = {
    challenge_path: 'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type',
  };

  it('should create a queue of auth flows', async () => {
    // Call createQueue function three times with a delay
    await expect(wrapper.vm.createQueue(new Event('message'), args)).rejects.toThrow('stop the flow');

    await wrapper.vm.createQueue(new Event('message'), args);
    await wrapper.vm.createQueue(new Event('message'), args);

    const authQueue = wrapper.vm.authQueue;
    expect(authQueue.length).toBe(2);

    await expect(wrapper.vm.finishAndStartNextFlow()).rejects.toThrow('stop the flow');
    expect(authQueue.length).toBe(1);

    await expect(wrapper.vm.finishAndStartNextFlow()).rejects.toThrow('stop the flow');
    expect(authQueue.length).toBe(0);
  });
});
