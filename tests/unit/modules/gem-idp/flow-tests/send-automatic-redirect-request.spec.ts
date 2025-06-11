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

import { mount } from '@vue/test-utils';
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import IdpActions from '@/renderer/modules/gem-idp/components/IdpActions.vue';

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

describe('AuthFlow.vue', () => {
  beforeEach(() => {
    store.commit('idpServiceStore/resetStore');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send a request to the provided URL', async () => {
    const wrapper = mount(AuthFlow, {
      global: {
        plugins: [store, i18n],
      },
    });

    const url = 'http://localhost:' + PORT;

    await (wrapper.vm.$refs.idpActionsComponent as InstanceType<typeof IdpActions>).sendAutomaticRedirectRequest(url);

    expect(fetch).toHaveBeenCalledWith(url);
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Redirecting automatically flow completed from preload context');
  });

  it('should retry the request with window.api.httpGet if fetch fails', async () => {
    const wrapper = mount(AuthFlow, { global: { plugins: [store] } });
    const url = 'http://localhost:' + PORT;

    // @ts-ignore
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await (wrapper.vm.$refs.idpActionsComponent as InstanceType<typeof IdpActions>).sendAutomaticRedirectRequest(url);

    expect(fetch).toHaveBeenCalledWith(url);
    expect(logger.warn).toHaveBeenCalledWith(
      'Redirecting automatically request failed from Browser Context. Retry in Preload Context. Error: HTTP error! Status: 404. Message: Not Found',
    );
    // @ts-ignore
    expect(window.api.httpGet).toHaveBeenCalledWith(url, expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith('Redirecting automatically flow completed from preload context');
  });

  it('should handle errors in the second request', async () => {
    const wrapper = mount(AuthFlow, { global: { plugins: [store] } });
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

    await expect(async () => {
      await (wrapper.vm.$refs.idpActionsComponent as InstanceType<typeof IdpActions>).sendAutomaticRedirectRequest(url);
    }).rejects.toThrow();

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
