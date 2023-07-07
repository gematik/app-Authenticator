import { shallowMount } from '@vue/test-utils';
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { TCallback } from '@/renderer/modules/gem-idp/type-definitions';

const TEST_CHALLENGE_PATH =
  'https://xx.de/auth?client_id=GEMAmediTISHJL7rK0tR&response_type=code&nonce=UE54P39wyUKggjPsvItc&callback=DIRECT';

describe('GemIdpAuthFlowProcess.vue', () => {
  beforeEach(() => {
    store.commit('gemIdpServiceStore/resetStore');
  });

  const wrapper = shallowMount(GemIdpAuthFlowProcess, {
    global: {
      plugins: [store, i18n],
    },
  });

  it('should correctly set challenge path from challenge path and return correct value', async () => {
    // Set up test data

    const expectedChallengePath =
      'https://xx.de/auth?client_id=GEMAmediTISHJL7rK0tR&response_type=code&nonce=UE54P39wyUKggjPsvItc';

    const param = 'callback';

    // Call the function
    const returnValue = wrapper.vm.popParamFromChallengePath(param, TEST_CHALLENGE_PATH);

    // Verify results
    expect(store.state.gemIdpServiceStore.challengePath).toBe(expectedChallengePath);
    expect(returnValue).toBe(TCallback.DIRECT);
  });

  it('negative: should return empty string and should not change the challenge path in store', async () => {
    const param = 'non-existing-param';

    // Call the function
    const returnValue = wrapper.vm.popParamFromChallengePath(param, TEST_CHALLENGE_PATH);

    // Verify results
    expect(store.state.gemIdpServiceStore.challengePath).toBe('');
    expect(returnValue).toBe('');
  });
});
