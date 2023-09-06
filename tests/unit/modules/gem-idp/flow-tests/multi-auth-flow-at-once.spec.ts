import { shallowMount } from '@vue/test-utils';
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { logger } from '@/renderer/service/logger';
import router from '@/renderer/router';
import { createRouter, createWebHistory } from 'vue-router';

// prevent over logging
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'debug').mockImplementation(() => {});

describe('GemIdpAuthFlowProcess multi-auth-flow-at-once.spec.ts', () => {
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
    challenge_path: 'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type',
  };

  it('should create a queue of auth flows', async () => {
    // Call createQueue function three times with a delay
    await expect(wrapper.vm.createQueue(new Event('message'), args)).rejects.toThrow('stop the flow');

    wrapper.vm.createQueue(new Event('message'), args);
    wrapper.vm.createQueue(new Event('message'), args);

    const authQueue = wrapper.vm.authQueue;
    expect(authQueue.length).toBe(2);

    await expect(wrapper.vm.finishAndStartNextFlow()).rejects.toThrow('stop the flow');
    expect(authQueue.length).toBe(1);

    await expect(wrapper.vm.finishAndStartNextFlow()).rejects.toThrow('stop the flow');
    expect(authQueue.length).toBe(0);
  });
});
