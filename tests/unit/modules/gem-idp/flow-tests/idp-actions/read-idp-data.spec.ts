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
import IdpActions from '@/renderer/modules/gem-idp/components/IdpActions.vue';
import { ERROR_CODES } from '@/error-codes';
import { AuthFlowError, UserfacingError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import * as utils from '@/renderer/utils/utils';
import { mockSwal } from '@tests/utils';

describe('IdpActions readIdpData', () => {
  let wrapper: VueWrapper<InstanceType<typeof IdpActions>>;
  let mockStoreDispatch: jest.Mock;
  let spyAlertDefinedError: jest.SpyInstance;

  beforeEach(() => {
    mockStoreDispatch = jest.fn();
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional');
    spyAlertDefinedError.mockClear();

    const mockStore = {
      dispatch: mockStoreDispatch,
    };

    wrapper = shallowMount(IdpActions, {
      global: {
        mocks: {
          $store: mockStore,
        },
      },
    });

    jest.clearAllMocks();
  });

  it('should succeed if both getDiscoveryDocument and getIdpEncJwk succeed', async () => {
    await expect(wrapper.vm.readIdpData()).resolves.toBeUndefined();
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getDiscoveryDocument');
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getIdpEncJwk');
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should rethrow AuthFlowError from getDiscoveryDocument', async () => {
    const authError = new AuthFlowError('AuthFlow error', 'details', undefined, true, OAUTH2_ERROR_TYPE.SERVER_ERROR);
    mockStoreDispatch.mockImplementationOnce(() => {
      throw authError;
    });

    await expect(wrapper.vm.readIdpData()).rejects.toThrow(authError);
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(mockStoreDispatch).toHaveBeenCalledTimes(1);
  });

  it('should rethrow AuthFlowError from getIdpEncJwk', async () => {
    mockStoreDispatch
      .mockResolvedValueOnce(undefined) // getDiscoveryDocument success
      .mockImplementationOnce(() => {
        throw new AuthFlowError('AuthFlow error', 'details', undefined, true, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      });

    await expect(wrapper.vm.readIdpData()).rejects.toThrow('AuthFlow error');
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getDiscoveryDocument');
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getIdpEncJwk');
  });

  it('should show alert and throw AuthFlowError if getDiscoveryDocument fails with non-AuthFlowError', async () => {
    mockSwal(false);
    mockStoreDispatch.mockImplementationOnce(() => {
      throw new Error('Some random error');
    });

    await expect(wrapper.vm.readIdpData()).rejects.toThrow(`Error while reading IdP data (${ERROR_CODES.AUTHCL_0002})`);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0002);
    expect(mockStoreDispatch).toHaveBeenCalledTimes(1);
  });

  it('should show alert and throw AuthFlowError if getIdpEncJwk fails with non-AuthFlowError', async () => {
    mockSwal(false);
    mockStoreDispatch
      .mockResolvedValueOnce(undefined) // getDiscoveryDocument success
      .mockImplementationOnce(() => {
        throw new UserfacingError('User facing', 'desc', 'SOME_CODE');
      });

    await expect(wrapper.vm.readIdpData()).rejects.toThrow(`Error while reading IdP data (${ERROR_CODES.AUTHCL_0002})`);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0002);
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getDiscoveryDocument');
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getIdpEncJwk');
  });
});
