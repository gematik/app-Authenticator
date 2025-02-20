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
import ConnectorActions from '@/renderer/modules/gem-idp/components/ConnectorActions.vue';
import * as utils from '@/renderer/utils/utils';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { CRYPT_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import { AuthFlowError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import * as CertificateReaderLauncher from '@/renderer/modules/connector/connector_impl/certificate-reader-launcher';

describe('ConnectorActions getCardCertificate', () => {
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

  it('should call the connectorStore/getCardCertificate', async () => {
    mockStoreDispatch.mockResolvedValueOnce(undefined);

    await expect(wrapper.vm.getCardCertificate(ECardTypes.HBA)).resolves.toBeUndefined();
    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/getCardCertificate', 'HBA');
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should fail with ECC, switch to RSA, and succeed', async () => {
    // First attempt fails
    const eccError = new Error('ECC certificate failed');
    mockStoreDispatch.mockRejectedValueOnce(eccError);
    // Second attempt with RSA succeeds
    mockStoreDispatch.mockResolvedValueOnce(undefined);

    await expect(wrapper.vm.getCardCertificate(ECardTypes.SMCB)).resolves.toBeUndefined();

    // First call with ECC fails
    expect(mockStoreDispatch).toHaveBeenNthCalledWith(1, 'connectorStore/getCardCertificate', ECardTypes.SMCB);
    // After failure, RSA should be set
    expect(ConnectorConfig.certReaderParameter.crypt).toBe(CRYPT_TYPES.RSA);
    expect(ConnectorConfig.authSignParameter.signatureType).toBe(SIGNATURE_TYPES.RSA);

    // Second call with RSA succeeds
    expect(mockStoreDispatch).toHaveBeenNthCalledWith(2, 'connectorStore/getCardCertificate', ECardTypes.SMCB);

    // No errors handled, no alert shown after final success
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should fail with ECC and RSA, call handleErrors, show alert, and throw AuthFlowError', async () => {
    const eccError = new Error('ECC failure');
    const rsaError = new Error('RSA failure');
    mockStoreDispatch.mockRejectedValueOnce(eccError).mockRejectedValueOnce(rsaError);

    await expect(wrapper.vm.getCardCertificate(ECardTypes.HBA)).rejects.toThrow(AuthFlowError);

    // First attempt with ECC failed
    expect(mockStoreDispatch).toHaveBeenNthCalledWith(1, 'connectorStore/getCardCertificate', 'HBA');

    // Config should switch to RSA
    expect(ConnectorConfig.certReaderParameter.crypt).toBe(CRYPT_TYPES.RSA);
    expect(ConnectorConfig.authSignParameter.signatureType).toBe(SIGNATURE_TYPES.RSA);

    // Second attempt with RSA also failed
    expect(mockStoreDispatch).toHaveBeenNthCalledWith(2, 'connectorStore/getCardCertificate', 'HBA');

    // handleErrors should have been called with the second error
    expect(spyHandleErrors).toHaveBeenCalledWith(rsaError);

    // alertDefinedErrorWithDataOptional should be called with AUTHCL_1107
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1107);

    // No further calls
    jest.spyOn(CertificateReaderLauncher, 'launch').mockImplementation(() => {
      throw new Error('CertificateReaderLauncher error');
    });

    // The thrown error should be AuthFlowError with correct message
    try {
      await wrapper.vm.getCardCertificate(ECardTypes.HBA);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthFlowError);
      const authErr = err as AuthFlowError;
      expect(authErr.message).toContain(`(${ERROR_CODES.AUTHCL_1107})`);
      expect(authErr.errorType).toBe(OAUTH2_ERROR_TYPE.SERVER_ERROR);
    }
  });
});
