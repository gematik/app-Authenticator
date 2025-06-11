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
import { shallowMount, VueWrapper } from '@vue/test-utils';
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import { TAuthFlowEndState } from '@/@types/common-types';
import { TAccessDataResponse } from '@/renderer/modules/gem-idp/type-definitions';

describe('AuthFlow sendAuthorizationRequest', () => {
  let wrapper: VueWrapper<InstanceType<typeof AuthFlow>>;
  let mockStoreDispatch: jest.SpyInstance;

  beforeEach(() => {
    // Create a mocked store
    const mockStore = {
      dispatch: jest.fn(),
    };

    wrapper = shallowMount(AuthFlow, {
      global: {
        mocks: {
          $store: mockStore,
        },
      },
    });

    mockStoreDispatch = wrapper.vm.$store.dispatch as any;
    jest.clearAllMocks();
  });

  it('should return {isSuccess: false, url: errorUri} when the action returns an errorUri', async () => {
    const accessData: TAccessDataResponse = {
      errorUri: 'https://idp.example.com/errorinfo',
      statusCode: 400,
      idpError: undefined,
    };

    mockStoreDispatch.mockResolvedValue(accessData);

    const result: TAuthFlowEndState = await wrapper.vm.sendAuthorizationRequest();
    expect(result).toEqual({ isSuccess: false, url: 'https://idp.example.com/errorinfo' });
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/sendAuthorizationRequestAction');
  });

  it('should return {isSuccess: true, url: redirectUri} when the action returns a redirectUri', async () => {
    const accessData: TAccessDataResponse = {
      redirectUri: 'https://client.example.com/callback?code=abc123',
      statusCode: 302,
      idpError: undefined,
    };

    mockStoreDispatch.mockResolvedValue(accessData);

    const result: TAuthFlowEndState = await wrapper.vm.sendAuthorizationRequest();
    expect(result).toEqual({ isSuccess: true, url: 'https://client.example.com/callback?code=abc123' });
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/sendAuthorizationRequestAction');
  });

  it('should return {isSuccess: false, url: ""} when neither errorUri nor redirectUri is provided', async () => {
    const accessData: TAccessDataResponse = {
      statusCode: 200,
      idpError: undefined,
      // no errorUri or redirectUri
    };

    mockStoreDispatch.mockResolvedValue(accessData);

    const result: TAuthFlowEndState = await wrapper.vm.sendAuthorizationRequest();
    expect(result).toEqual({ isSuccess: false, url: '' });
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/sendAuthorizationRequestAction');
  });
});
