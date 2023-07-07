import { shallowMount } from '@vue/test-utils';
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import { ALLOWED_DEEPLINK_PROTOCOLS } from '@/constants';

describe('GemIdpAuthFlowProcess.vue', () => {
  const wrapper = shallowMount(GemIdpAuthFlowProcess, {
    global: {
      plugins: [store, i18n],
    },
  });

  it('sets callback to OPEN_TAB by default', async () => {
    expect(wrapper.vm.setCallback(null)).toBe(true);
    expect(store.state.gemIdpServiceStore.callback).toBe(TCallback.OPEN_TAB);
  });

  it('sets callback to DIRECT for DIRECT value', async () => {
    expect(wrapper.vm.setCallback(TCallback.DIRECT)).toBe(true);
    expect(store.state.gemIdpServiceStore.callback).toBe(TCallback.DIRECT);
  });

  it('sets callback and deeplink for valid deeplink', async () => {
    const validDeeplink = ALLOWED_DEEPLINK_PROTOCOLS[0];
    expect(wrapper.vm.setCallback(validDeeplink)).toBe(true);
    expect(store.state.gemIdpServiceStore.callback).toBe(TCallback.DEEPLINK);
    expect(store.state.gemIdpServiceStore.deeplink).toBe(validDeeplink);
  });

  it('returns false for invalid value', async () => {
    const invalidValue = 'invalid-value';
    expect(wrapper.vm.setCallback(invalidValue)).toBe(false);
  });
});
