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
import { shallowMount, VueWrapper } from '@vue/test-utils';
import PinActions from '@/renderer/modules/gem-idp/components/PinActions.vue';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import * as utils from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import * as configModule from '@/renderer/utils/get-configs';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';

describe('PinActions checkPinStatus', () => {
  let wrapper: VueWrapper<InstanceType<typeof PinActions>>;
  let mockStoreDispatch: jest.SpyInstance;
  let spyHandleErrors: jest.SpyInstance;
  let spyAlertDefinedError: jest.SpyInstance;
  let spyAlertWithCancelButton: jest.SpyInstance;
  let spyAlertLoginResultWithIconAndTimer: jest.SpyInstance;
  let mockFocusToApp: jest.SpyInstance;
  let mockGetConfig: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStoreDispatch = jest.spyOn(store, 'dispatch');
    spyHandleErrors = jest.fn();
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional').mockResolvedValue();
    spyAlertWithCancelButton = jest
      .spyOn(utils, 'alertWithCancelButton')
      .mockResolvedValue({ isConfirmed: false, value: undefined, isDenied: false, isDismissed: false });
    spyAlertLoginResultWithIconAndTimer = jest.spyOn(utils, 'alertLoginResultWithIconAndTimer').mockResolvedValue();

    mockFocusToApp = jest.spyOn(window.api, 'focusToApp').mockImplementation(() => {});

    mockGetConfig = jest.spyOn(configModule, 'getConfig');

    wrapper = shallowMount(PinActions, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: spyHandleErrors as any,
      },
    });
  });

  it('should succeed with no alerts if pinStatus is verified (isPinStatusVerified=true)', async () => {
    mockStoreDispatch.mockResolvedValueOnce(true); // isPinStatusVerified = true

    await expect(wrapper.vm.checkPinStatus(ECardTypes.HBA)).resolves.toBeUndefined();

    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/checkPinStatus', ECardTypes.HBA);
    // No alerts shown
    expect(mockFocusToApp).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(spyAlertWithCancelButton).not.toHaveBeenCalled();
    expect(spyAlertLoginResultWithIconAndTimer).not.toHaveBeenCalled();
    // No errors
    expect(spyHandleErrors).not.toHaveBeenCalled();
  });

  it('should show alert and throw AuthFlowError if cardType=SMCB, smcbPinOption = false and isPinStatusVerified=false', async () => {
    mockGetConfig.mockResolvedValueOnce({ value: false });
    // For SMCB and isPinStatusVerified = false => it should show error AUTHCL_1106 and throw
    mockStoreDispatch.mockResolvedValueOnce(false);

    await expect(wrapper.vm.checkPinStatus(ECardTypes.SMCB)).rejects.toThrow(AuthFlowError);

    expect(mockGetConfig).toHaveBeenCalledWith(ENTRY_OPTIONS_CONFIG_GROUP.SMCB_PIN_OPTION);
    expect(mockFocusToApp).toHaveBeenCalled();
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1106);
    // handleErrors is not called for this flow, because it's a direct known scenario
    expect(spyHandleErrors).not.toHaveBeenCalled();
    // No call to alertWithCancelButton
    expect(spyAlertWithCancelButton).not.toHaveBeenCalled();
  });
  it('should show a cancel button alert if cardType=SMCB, smcbPinOption = true and isPinStatusVerified=false', async () => {
    mockGetConfig.mockReturnValueOnce({ value: true });
    mockStoreDispatch.mockResolvedValueOnce(false);

    await expect(wrapper.vm.checkPinStatus(ECardTypes.SMCB)).resolves.toBeUndefined();

    expect(mockGetConfig).toHaveBeenCalledWith(ENTRY_OPTIONS_CONFIG_GROUP.SMCB_PIN_OPTION);
    expect(mockFocusToApp).toHaveBeenCalled();
    // For HBA with isPinStatusVerified=false => calls alertWithCancelButton
    expect(spyAlertWithCancelButton).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_2003, ECardTypes.SMCB);
    // No exception is thrown here
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(spyHandleErrors).not.toHaveBeenCalled();
  });
  it('should show a cancel button alert if cardType=HBA and isPinStatusVerified=false', async () => {
    mockStoreDispatch.mockResolvedValueOnce(false);

    await expect(wrapper.vm.checkPinStatus(ECardTypes.HBA)).resolves.toBeUndefined();

    expect(mockFocusToApp).toHaveBeenCalled();
    // For HBA with isPinStatusVerified=false => calls alertWithCancelButton
    expect(spyAlertWithCancelButton).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_2002, ECardTypes.HBA);
    // No exception is thrown here
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(spyHandleErrors).not.toHaveBeenCalled();
  });

  it('should handle errors by calling handleErrors, show AUTHCL_1101 alert, and throw AuthFlowError', async () => {
    const genericError = new Error('Connector error');
    mockStoreDispatch.mockRejectedValueOnce(genericError);

    await expect(wrapper.vm.checkPinStatus(ECardTypes.HBA)).rejects.toThrow(
      `Check Pin Status failed! (${ERROR_CODES.AUTHCL_1101})`,
    );

    expect(spyHandleErrors).toHaveBeenCalledWith(genericError);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1101);

    try {
      await wrapper.vm.checkPinStatus(ECardTypes.HBA);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthFlowError);
      const authErr = err as AuthFlowError;
      expect(authErr.errorType).toBe(OAUTH2_ERROR_TYPE.ACCESS_DENIED);
      expect(authErr.message).toContain(ERROR_CODES.AUTHCL_1101);
    }
  });
});
