import { shallowMount } from '@vue/test-utils';
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import axios from 'axios';

// Mocking logger functions
// Mocking logger functions
jest.mock('@/renderer/service/logger', () => {
  const originalModule = jest.requireActual('@/renderer/service/logger');

  return {
    __esModule: true,
    ...originalModule,
    logger: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
  };
});

// Mocking fetch and window.api.httpGet
global.fetch = jest.fn();

// mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// @ts-ignore
window.api.httpGet = jest.fn();

// @ts-ignore
window.api.send = jest.fn();

// @ts-ignore
window.api.openExternal = jest.fn();

describe('GemIdpAuthFlowProcess.vue', () => {
  beforeEach(() => {
    store.commit('gemIdpServiceStore/resetStore');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send a request to the provided URL', async () => {
    const wrapper = shallowMount(GemIdpAuthFlowProcess, {
      global: {
        plugins: [store, i18n],
      },
    });

    const url = 'http://localhost:3000';

    await wrapper.vm.sendAutomaticRedirectRequest(url);

    expect(axios.get).toHaveBeenCalledWith(url);
    expect(logger.info).toHaveBeenCalledWith('Redirecting automatically flow completed from browser context');
  });

  it('should retry the request with window.api.httpGet if fetch fails', async () => {
    const wrapper = shallowMount(GemIdpAuthFlowProcess, { global: { plugins: [store] } });
    const url = 'http://localhost:3000';

    // @ts-ignore
    axios.get.mockImplementationOnce(() => {
      throw new Error('Fetch Error');
    });

    await wrapper.vm.sendAutomaticRedirectRequest(url);

    expect(axios.get).toHaveBeenCalledWith(url);
    expect(logger.warn).toHaveBeenCalledWith(
      'Redirecting automatically request failed from Browser Context. Retry in Preload Context. Error: Fetch Error',
    );
    // @ts-ignore
    expect(window.api.httpGet).toHaveBeenCalledWith(url, expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith('Redirecting automatically flow completed from preload context');
  });

  it('should handle errors in the second request', async () => {
    const wrapper = shallowMount(GemIdpAuthFlowProcess, { global: { plugins: [store] } });
    const url = 'http://localhost:3000';

    // @ts-ignore
    axios.get.mockImplementationOnce(() => {
      throw new Error('Fetch Error');
    });

    // @ts-ignore
    window.api.httpGet.mockImplementationOnce(() => {
      throw new Error('httpGet Error');
    });

    await wrapper.vm.sendAutomaticRedirectRequest(url);

    expect(axios.get).toHaveBeenCalledWith(url);
    expect(logger.warn).toHaveBeenCalledWith(
      'Redirecting automatically request failed from Browser Context. Retry in Preload Context. Error: Fetch Error',
    );

    // @ts-ignore
    expect(window.api.httpGet).toHaveBeenCalledWith(url, expect.any(Object));
    expect(logger.error).toHaveBeenCalledWith(
      'Redirecting automatically request failed! Error message: ',
      'httpGet Error',
    );
  });
});
