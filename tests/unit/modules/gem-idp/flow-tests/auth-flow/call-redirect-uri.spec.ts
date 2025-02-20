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
import { shallowMount } from '@vue/test-utils';
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import { OAUTH2_ERROR_TYPE, TAuthArguments, TCallback } from '@/renderer/modules/gem-idp/type-definitions';

import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

describe('AuthFlow callRedirectUri', () => {
  let wrapper: any;
  let mockOpenExternal: jest.Mock;
  let mockSendAutomaticRedirectRequest: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockOpenExternal = jest.fn();
    mockSendAutomaticRedirectRequest = jest.fn();

    jest.spyOn(window.api, 'openExternal').mockImplementation(mockOpenExternal);
    jest.spyOn(window.api, 'focusToApp').mockImplementation(jest.fn());
    jest.spyOn(window.api, 'send').mockImplementation(jest.fn());
    jest.spyOn(window.api, 'sendSync').mockImplementation(jest.fn());
    jest.spyOn(window.api, 'utilFormat').mockImplementation(jest.fn());
    jest.spyOn(window.api, 'httpGet').mockImplementation(jest.fn());

    store.commit(
      'idpServiceStore/setChallengePath',
      'https://idp.example.com/auth?redirect_uri=https://client.example.com/cb&state=xyz',
    );

    // Mount component
    wrapper = shallowMount(AuthFlow, {
      global: {
        plugins: [store, i18n],
      },
      // Mock refs
      data() {
        return {
          isAuthProcessActive: false,
          attemptId: '',
          // awaiting auth flow requests
          authQueue: [] as {
            event: Event;
            args: TOidcProtocol2UrlSpec;
            loginAttemptId: string;
          }[],
          authArguments: {
            deeplink: '',
            callbackType: TCallback.OPEN_TAB,
            cardType: ECardTypes.SMCB,
          } as TAuthArguments,
        };
      },
      attachToDocument: true,
    });

    // Mock IdpActions component ref
    (wrapper.vm.$refs.idpActionsComponent as any).sendAutomaticRedirectRequest = mockSendAutomaticRedirectRequest;

    jest.clearAllMocks();
  });

  it('returns false if no url is provided', async () => {
    const authFlowEndState = { isSuccess: true, url: '' };

    const result = await wrapper.vm.callRedirectUri(authFlowEndState);
    expect(result).toBe(false);
    expect(mockOpenExternal).not.toHaveBeenCalled();
    expect(mockSendAutomaticRedirectRequest).not.toHaveBeenCalled();
  });

  it('returns false if protocol is invalid', async () => {
    const authFlowEndState = { isSuccess: true, url: 'ftp://malicious.com' };
    const result = await wrapper.vm.callRedirectUri(authFlowEndState);
    expect(result).toBe(false);
    expect(mockOpenExternal).not.toHaveBeenCalled();
  });

  it('if isSuccess = false, we have a given url and protocol is invalid, returns false', async () => {
    wrapper.vm.authArguments.callbackType = 'OPEN_TAB';
    const authFlowEndState = { isSuccess: false, url: 'xx://unsecure-url.com' };
    const errorType = OAUTH2_ERROR_TYPE.SERVER_ERROR;
    const errorText = 'Something went wrong';

    const result = await wrapper.vm.callRedirectUri(authFlowEndState, errorType, errorText);
    expect(result).toBe(false);
    expect(mockOpenExternal).not.toHaveBeenCalled();
  });

  it('opens external if isSuccess = true and callbackType = OPEN_TAB', async () => {
    wrapper.vm.authArguments.callbackType = 'OPEN_TAB';
    const authFlowEndState = { isSuccess: true, url: 'https://client.example.com/callback' };

    const result = await wrapper.vm.callRedirectUri(authFlowEndState);
    expect(result).toBe(true);
    // Card type appended
    expect(mockOpenExternal).toHaveBeenCalledWith('https://client.example.com/callback?cardType=SMC-B');
  });

  it('calls sendAutomaticRedirectRequest if isSuccess = true and callbackType = DIRECT', async () => {
    wrapper.vm.authArguments.callbackType = 'DIRECT';
    const authFlowEndState = { isSuccess: true, url: 'https://client.example.com/callback' };

    const result = await wrapper.vm.callRedirectUri(authFlowEndState);
    expect(result).toBe(true);
    expect(mockSendAutomaticRedirectRequest).toHaveBeenCalledWith('https://client.example.com/callback?cardType=SMC-B');
  });

  it('creates and opens deeplink if isSuccess = true and callbackType = DEEPLINK', async () => {
    wrapper.vm.authArguments.callbackType = TCallback.DEEPLINK;
    wrapper.vm.authArguments.deeplink = 'tim';
    const authFlowEndState = { isSuccess: true, url: 'https://client.example.com/callback?code=123' };

    const result = await wrapper.vm.callRedirectUri(authFlowEndState);
    expect(result).toBe(true);
    expect(mockOpenExternal).toHaveBeenCalledWith('tim://code=123&cardType=SMC-B');
  });

  it('if isSuccess = false and no url, tries to parse from challenge_path, append error and returns true if protocol is valid', async () => {
    wrapper.vm.authArguments.callbackType = 'OPEN_TAB';
    const authFlowEndState = { isSuccess: false, url: '' };
    const errorType = OAUTH2_ERROR_TYPE.SERVER_ERROR;
    const errorText = 'Something went wrong';

    const result = await wrapper.vm.callRedirectUri(authFlowEndState, errorType, errorText);
    expect(result).toBe(true);

    // // Let's just ensure openExternal is called with something starting with that redirect URI and includes error, state and cardType:
    const calledUrl = mockOpenExternal.mock.calls[0][0];
    expect(calledUrl).toBe(
      'https://client.example.com/cb?error=server_error&error_details=Something+went+wrong&state=xyz&error_uri=https%3A%2F%2Fwiki.gematik.de%2Fx%2F-A3OGw&cardType=SMC-B',
    );
  });
});
