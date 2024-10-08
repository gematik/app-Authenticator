import { shallowMount } from '@vue/test-utils';
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';

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

// @ts-ignore
window.api.httpGet = jest.fn();

// @ts-ignore
window.api.send = jest.fn();

// @ts-ignore
window.api.openExternal = jest.fn();

const PORT = '3000';

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

    const url = 'http://localhost:' + PORT;

    await wrapper.vm.sendAutomaticRedirectRequest(url);

    expect(fetch).toHaveBeenCalledWith(url);
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Redirecting automatically flow completed from preload context');
  });

  it('should retry the request with window.api.httpGet if fetch fails', async () => {
    const wrapper = shallowMount(GemIdpAuthFlowProcess, { global: { plugins: [store] } });
    const url = 'http://localhost:' + PORT;

    // @ts-ignore
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await wrapper.vm.sendAutomaticRedirectRequest(url);

    expect(fetch).toHaveBeenCalledWith(url);
    expect(logger.warn).toHaveBeenCalledWith(
      'Redirecting automatically request failed from Browser Context. Retry in Preload Context. Error: HTTP error! Status: 404. Message: Not Found',
    );
    // @ts-ignore
    expect(window.api.httpGet).toHaveBeenCalledWith(url, expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith('Redirecting automatically flow completed from preload context');
  });

  fit('should handle errors in the second request', async () => {
    const wrapper = shallowMount(GemIdpAuthFlowProcess, { global: { plugins: [store] } });
    const url = 'http://localhost:' + PORT;

    // @ts-ignore
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // @ts-ignore
    window.api.httpGet.mockImplementationOnce(() => {
      throw new Error('httpGet Error');
    });

    await wrapper.vm.sendAutomaticRedirectRequest(url);

    expect(fetch).toHaveBeenCalledWith(url);
    expect(logger.warn).toHaveBeenCalledWith(
      'Redirecting automatically request failed from Browser Context. Retry in Preload Context. Error: HTTP error! Status: 404. Message: Not Found',
    );

    // @ts-ignore
    expect(window.api.httpGet).toHaveBeenCalledWith(url, expect.any(Object));
    expect(logger.error).toHaveBeenCalledWith(
      'Redirecting automatically request failed! Error message: ',
      'httpGet Error',
    );
  });
});
