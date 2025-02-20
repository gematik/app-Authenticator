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
import IdpActions from '@/renderer/modules/gem-idp/components/IdpActions.vue';
import { ERROR_CODES } from '@/error-codes';
import { UserfacingError } from '@/renderer/errors/errors';
import * as utils from '@/renderer/utils/utils';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { mockSwal } from '@tests/utils';

describe('IdpActions getChallengeDataFromIdp', () => {
  let wrapper: VueWrapper<InstanceType<typeof IdpActions>>;
  let mockStoreDispatch: jest.Mock;
  let spyAlertDefinedError: jest.SpyInstance;
  let mockFocusToApp: jest.SpyInstance;

  beforeEach(() => {
    mockStoreDispatch = jest.fn();
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional').mockClear();
    mockFocusToApp = jest.spyOn(window.api, 'focusToApp').mockImplementation(jest.fn());

    const mockStore = {
      state: store.state,
      dispatch: mockStoreDispatch,
    };

    wrapper = shallowMount(IdpActions, {
      global: {
        plugins: [store, i18n],
        mocks: {
          $store: mockStore,
        },
      },
    });

    jest.clearAllMocks();
  });

  it('should succeed if getChallengeData resolves successfully', async () => {
    mockStoreDispatch.mockResolvedValueOnce(true);

    const result = await wrapper.vm.getChallengeDataFromIdp();

    expect(result).toBe(true);
    expect(mockStoreDispatch).toHaveBeenCalledWith('idpServiceStore/getChallengeData');
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(mockFocusToApp).not.toHaveBeenCalled();
  });

  it('should handle UserfacingError with AUTHCL_0005 correctly', async () => {
    mockSwal(false);
    const userfacingError = new UserfacingError('Userfacing error', 'description', ERROR_CODES.AUTHCL_0005);
    mockStoreDispatch.mockRejectedValueOnce(userfacingError);

    await expect(wrapper.vm.getChallengeDataFromIdp()).rejects.toThrow(
      `Error while getting challenge data from IdP (${ERROR_CODES.AUTHCL_0005})`,
    );

    expect(mockFocusToApp).toHaveBeenCalled();
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0005);
  });

  it('should handle non-AUTHCL_0005 errors by showing an alert and throwing an AuthFlowError', async () => {
    mockSwal(false);
    const userfacingError = new UserfacingError('Userfacing error', 'description', ERROR_CODES.AUTHCL_0002);
    mockStoreDispatch.mockRejectedValueOnce(userfacingError);

    await expect(wrapper.vm.getChallengeDataFromIdp()).rejects.toThrow(
      `Error while getting challenge data from IdP (${ERROR_CODES.AUTHCL_0002})`,
    );

    expect(mockFocusToApp).toHaveBeenCalled();
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0002);
  });

  it('should handle other errors (not UserfacingError) by showing an alert and throwing an AuthFlowError', async () => {
    mockSwal(false);
    const genericError = new Error('Some unexpected error');
    mockStoreDispatch.mockRejectedValueOnce(genericError);

    await expect(wrapper.vm.getChallengeDataFromIdp()).rejects.toThrow(
      `Error while getting challenge data from IdP (${ERROR_CODES.AUTHCL_0002})`,
    );

    expect(mockFocusToApp).toHaveBeenCalled();
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0002);
  });
});
