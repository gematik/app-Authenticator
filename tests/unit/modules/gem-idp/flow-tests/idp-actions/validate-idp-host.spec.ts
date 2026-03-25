/*
 * Copyright 2026, gematik GmbH
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
import * as utils from '@/renderer/utils/utils';
import * as configModule from '@/renderer/utils/get-configs';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { mockSwal } from '@tests/utils';
import { DEVELOPER_OPTIONS } from '@/renderer/modules/connector/connector-mock/mock-config';

describe('IdpActions validateIdpHost', () => {
  let wrapper: VueWrapper<InstanceType<typeof IdpActions>>;
  let spyAlertDefinedError: jest.SpyInstance;
  let mockGetConfig: jest.SpyInstance;

  beforeEach(() => {
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional');
    spyAlertDefinedError.mockClear();

    // Default: no additional allowed hosts
    mockGetConfig = jest.spyOn(configModule, 'getConfig');
    mockGetConfig.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === DEVELOPER_OPTIONS.IDP_ADDITIONAL_ALLOWED_HOSTS) {
        return { value: '', name: 'idpAdditionalAllowedHosts' };
      }
      return { value: defaultValue, name: key };
    });

    wrapper = shallowMount(IdpActions, {
      global: {
        plugins: [store, i18n],
      },
    });
  });

  afterEach(() => {
    mockGetConfig.mockRestore();
  });

  it('should allow an IDP host that is in the IDP_ALLOWED_HOSTS list', async () => {
    store.commit('idpServiceStore/setIdpHost', 'https://idp.app.ti-dienste.de');

    await expect(wrapper.vm.validateIdpHost()).resolves.toBeUndefined();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should allow the second allowed IDP host', async () => {
    store.commit('idpServiceStore/setIdpHost', 'https://idp.zentral.idp.splitdns.ti-dienste.de');

    await expect(wrapper.vm.validateIdpHost()).resolves.toBeUndefined();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should throw AuthFlowError if IDP host is not in the allowed list', async () => {
    mockSwal(false);
    store.commit('idpServiceStore/setIdpHost', 'https://evil-idp.example.com');

    await expect(wrapper.vm.validateIdpHost()).rejects.toThrow(`Not allowed IDP! (${ERROR_CODES.AUTHCL_0014})`);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0014);
  });

  it('should throw AuthFlowError if IDP host URL is invalid', async () => {
    mockSwal(false);
    store.commit('idpServiceStore/setIdpHost', 'not-a-valid-url');

    await expect(wrapper.vm.validateIdpHost()).rejects.toThrow(`Not allowed IDP! (${ERROR_CODES.AUTHCL_0014})`);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0014);
  });

  it('should throw AuthFlowError if IDP host is empty', async () => {
    mockSwal(false);
    store.commit('idpServiceStore/setIdpHost', '');

    await expect(wrapper.vm.validateIdpHost()).rejects.toThrow(`Not allowed IDP! (${ERROR_CODES.AUTHCL_0014})`);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0014);
  });

  it('should rethrow AuthFlowError directly without calling alertDefinedError again', async () => {
    mockSwal(false);
    store.commit('idpServiceStore/setIdpHost', 'https://malicious-idp.com');

    await expect(wrapper.vm.validateIdpHost()).rejects.toBeInstanceOf(AuthFlowError);
    expect(spyAlertDefinedError).toHaveBeenCalledTimes(1);
  });

  it('should allow a host from the additional allowed hosts config', async () => {
    mockGetConfig.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === DEVELOPER_OPTIONS.IDP_ADDITIONAL_ALLOWED_HOSTS) {
        return { value: 'localhost,my-custom-idp.example.com', name: 'idpAdditionalAllowedHosts' };
      }
      return { value: defaultValue, name: key };
    });

    store.commit('idpServiceStore/setIdpHost', 'https://localhost');

    await expect(wrapper.vm.validateIdpHost()).resolves.toBeUndefined();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should allow a second host from the additional allowed hosts config', async () => {
    mockGetConfig.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === DEVELOPER_OPTIONS.IDP_ADDITIONAL_ALLOWED_HOSTS) {
        return { value: 'localhost,my-custom-idp.example.com', name: 'idpAdditionalAllowedHosts' };
      }
      return { value: defaultValue, name: key };
    });

    store.commit('idpServiceStore/setIdpHost', 'https://my-custom-idp.example.com');

    await expect(wrapper.vm.validateIdpHost()).resolves.toBeUndefined();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should still reject hosts not in the combined allowed list', async () => {
    mockSwal(false);
    mockGetConfig.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === DEVELOPER_OPTIONS.IDP_ADDITIONAL_ALLOWED_HOSTS) {
        return { value: 'localhost', name: 'idpAdditionalAllowedHosts' };
      }
      return { value: defaultValue, name: key };
    });

    store.commit('idpServiceStore/setIdpHost', 'https://evil-idp.example.com');

    await expect(wrapper.vm.validateIdpHost()).rejects.toThrow(`Not allowed IDP! (${ERROR_CODES.AUTHCL_0014})`);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0014);
  });

  it('should handle additional hosts with extra whitespace correctly', async () => {
    mockGetConfig.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === DEVELOPER_OPTIONS.IDP_ADDITIONAL_ALLOWED_HOSTS) {
        return { value: ' localhost , my-idp.test.de ', name: 'idpAdditionalAllowedHosts' };
      }
      return { value: defaultValue, name: key };
    });

    store.commit('idpServiceStore/setIdpHost', 'https://my-idp.test.de');

    await expect(wrapper.vm.validateIdpHost()).resolves.toBeUndefined();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });
});
