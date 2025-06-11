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
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import * as utils from '@/renderer/utils/utils';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { mockSwal } from '@tests/utils';

describe('IdpActions parseAndSetIdpHost', () => {
  let wrapper: VueWrapper<InstanceType<typeof IdpActions>>;
  let spyAlertDefinedError: jest.SpyInstance;
  const spyStore = jest.spyOn(store, 'commit');

  beforeEach(() => {
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional');
    spyAlertDefinedError.mockClear();

    wrapper = shallowMount(IdpActions, {
      global: {
        plugins: [store, i18n],
      },
    });
  });

  it('should successfully parse and set IdP host', async () => {
    store.commit(
      'idpServiceStore/setChallengePath',
      'https://idp.example.com/auth?redirect_uri=https://client.example.com/cb',
    );

    await expect(wrapper.vm.parseAndSetIdpHost()).resolves.toBeUndefined();

    // removeLastPartOfChallengePath('https://idp.example.com/auth?...') -> 'https://idp.example.com'
    expect(spyStore).toHaveBeenCalledWith('idpServiceStore/setIdpHost', 'https://idp.example.com');
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should show alert and throw AuthFlowError if invalid URL is provided', async () => {
    mockSwal(false);
    store.commit('idpServiceStore/setChallengePath', 'invalid-url');

    await expect(wrapper.vm.parseAndSetIdpHost()).rejects.toThrow(
      `Error while parsing and setting IdP host (${ERROR_CODES.AUTHCL_0001})`,
    );
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0001);
  });

  /**
   * Just in case someone refactor this code, this test is to ensure that we throw the right error
   */
  it('should rethrow AuthFlowError directly if already thrown inside parseAndSetIdpHost', async () => {
    mockSwal(false);

    store.commit(
      'idpServiceStore/setChallengePath',
      'https://idp.example.com/auth?redirect_uri=https://client.example.com/cb',
    );

    const authFlowError = new AuthFlowError(
      'AuthFlow error',
      'details',
      undefined,
      true,
      OAUTH2_ERROR_TYPE.INVALID_REQUEST,
    );
    spyStore.mockImplementationOnce(() => {
      throw authFlowError;
    });

    await expect(wrapper.vm.parseAndSetIdpHost()).rejects.toThrow(authFlowError);
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });
});
