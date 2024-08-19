import { createRouter, createWebHistory } from 'vue-router';
import { shallowMount } from '@vue/test-utils';

import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import router from '@/renderer/router';
import { logger } from '@/renderer/service/logger';

// prevent over logging
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'debug').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});

describe('GemIdpAuthFlowProcess multi-card-type.spec.ts', () => {
  const wrapper = shallowMount(GemIdpAuthFlowProcess, {
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
  wrapper.vm.parseAndSetIdpHost = jest.fn().mockImplementation(() => {
    throw new Error('stop the flow');
  });

  // Define test arguments
  const args = {
    challenge_path: 'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type&cardType=multi',
  };

  it('should create a queue of auth flows', async () => {
    // call function once, this will run for HBA and put the SMC-B into the queue
    await expect(wrapper.vm.createQueue(new Event('message'), args)).rejects.toThrow('stop the flow');

    // FIXME, this is wrong! Must be 0 as the first flow fails
    const authQueue = wrapper.vm.authQueue;
    expect(authQueue.length).toBe(1);

    // complete the HBA flow and start the SMC-B flow
    await expect(wrapper.vm.finishAndStartNextFlow()).rejects.toThrow('stop the flow');
    expect(authQueue.length).toBe(0);
  });
});
