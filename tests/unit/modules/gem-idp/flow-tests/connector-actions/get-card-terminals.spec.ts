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
import ConnectorActions from '@/renderer/modules/gem-idp/components/ConnectorActions.vue';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import * as utils from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';

describe('ConnectorActions getCardTerminals', () => {
  let wrapper: VueWrapper<InstanceType<typeof ConnectorActions>>;
  let mockStoreDispatch: jest.SpyInstance;
  let spyHandleErrors: jest.SpyInstance;
  let spyAlertDefinedError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStoreDispatch = jest.spyOn(store, 'dispatch');
    spyHandleErrors = jest.fn();
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional').mockResolvedValue();

    wrapper = shallowMount(ConnectorActions, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: spyHandleErrors as any,
      },
    });
  });

  it('should successfully get card terminals', async () => {
    mockStoreDispatch.mockResolvedValueOnce(undefined);

    await expect(wrapper.vm.getCardTerminals()).resolves.toBeUndefined();

    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/getCardTerminals');
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should handle errors by calling handleErrors and throwing AuthFlowError', async () => {
    const error = new Error('Connector error');
    mockStoreDispatch.mockRejectedValueOnce(error);

    await expect(wrapper.vm.getCardTerminals()).rejects.toThrow(AuthFlowError);

    // handleErrors should be called
    expect(spyHandleErrors).toHaveBeenCalledWith(error);

    // alertDefinedErrorWithDataOptional should be called with AUTHCL_1003
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1003);

    // The thrown error should include AUTHCL_1003 and be SERVER_ERROR
    try {
      await wrapper.vm.getCardTerminals();
    } catch (err) {
      expect(err).toBeInstanceOf(AuthFlowError);
      const authFlowError = err as AuthFlowError;
      expect(authFlowError.message).toContain(`(${ERROR_CODES.AUTHCL_1003})`);
      expect(authFlowError.errorType).toBe(OAUTH2_ERROR_TYPE.SERVER_ERROR);
    }
  });
});
