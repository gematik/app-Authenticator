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
import PinActions from '@/renderer/modules/gem-idp/components/PinActions.vue';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import * as utils from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';

describe('PinActions verifyPin', () => {
  let wrapper: VueWrapper<InstanceType<typeof PinActions>>;
  let mockStoreDispatch: jest.SpyInstance;
  let spyHandleErrors: jest.SpyInstance;
  let spyAlertDefinedError: jest.SpyInstance;
  let mockPinVerifyModalClose: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStoreDispatch = jest.spyOn(store, 'dispatch');
    spyHandleErrors = jest.fn();
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional').mockResolvedValue();

    wrapper = shallowMount(PinActions, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: spyHandleErrors as any,
      },
    });

    // We'll define a mock for pinVerifyModalClose
    mockPinVerifyModalClose = jest.fn();
    wrapper.vm.pinVerifyModalClose = mockPinVerifyModalClose;
  });

  it('should verify pin successfully and call pinVerifyModalClose if defined', async () => {
    // Mock success from store
    mockStoreDispatch.mockResolvedValueOnce(void 0);

    await expect(wrapper.vm.verifyPin('HBA')).resolves.toBeUndefined();

    // Store dispatch is called
    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/verifyPin', 'HBA');
    // pinVerifyModalClose is called since we set it
    expect(mockPinVerifyModalClose).toHaveBeenCalled();
    // No errors or alerts
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    // verifyPinPromise should be reset in finally block
    expect(wrapper.vm.verifyPinPromise).toBeUndefined();
  });

  it('should do nothing if pinVerifyModalClose is undefined', async () => {
    // Make pinVerifyModalClose undefined
    wrapper.vm.pinVerifyModalClose = undefined;
    mockStoreDispatch.mockResolvedValueOnce('success');

    await expect(wrapper.vm.verifyPin('HBA')).resolves.toBeUndefined();

    // store.dispatch is called
    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/verifyPin', 'HBA');
    // pinVerifyModalClose is undefined, so it won't be called
    expect(mockPinVerifyModalClose).not.toHaveBeenCalled();
    // No errors or alerts
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(wrapper.vm.verifyPinPromise).toBeUndefined();
  });

  it('should handle error, call handleErrors, show alert and throw AuthFlowError on store dispatch rejection', async () => {
    const error = new Error('Connector error');
    mockStoreDispatch.mockRejectedValueOnce(error);

    await expect(wrapper.vm.verifyPin('SMCB')).rejects.toThrow(AuthFlowError);

    // verifyPinPromise is set, store.dispatch fails
    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/verifyPin', 'SMCB');

    // pinVerifyModalClose should be called on error
    expect(mockPinVerifyModalClose).toHaveBeenCalled();

    // handleErrors is called with original error
    expect(spyHandleErrors).toHaveBeenCalledWith(error);

    // alertDefinedErrorWithDataOptional is called with AUTHCL_1102
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1102);

    // The thrown error should be AuthFlowError with correct code
    try {
      await wrapper.vm.verifyPin('SMCB');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthFlowError);
      const authErr = err as AuthFlowError;
      expect(authErr.message).toContain(`(${ERROR_CODES.AUTHCL_1102})`);
      expect(authErr.errorType).toBe(OAUTH2_ERROR_TYPE.ACCESS_DENIED);
    }

    // verifyPinPromise should be reset in finally block
    expect(wrapper.vm.verifyPinPromise).toBeUndefined();
  });
});
