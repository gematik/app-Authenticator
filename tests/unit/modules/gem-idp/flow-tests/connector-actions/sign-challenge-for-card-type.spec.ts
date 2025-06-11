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
import { ERROR_CODES } from '@/error-codes';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import * as utils from '@/renderer/utils/utils';

describe('ConnectorActions signChallengeForCardType', () => {
  let wrapper: VueWrapper<InstanceType<typeof ConnectorActions>>;
  let mockStoreDispatch: jest.SpyInstance;
  let spyHandleErrors: jest.SpyInstance;
  let spyAlertDefinedError: jest.SpyInstance;
  let mockStoreCommit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStoreDispatch = jest.spyOn(store, 'dispatch');
    mockStoreCommit = jest.spyOn(store, 'commit');
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

    // Default state setup
    store.state.idpServiceStore.challenge = 'mocked-challenge';
    store.state.connectorStore.cards = {
      [ECardTypes.HBA]: {
        cardType: ECardTypes.HBA,
        ctId: 'string',
        slotNr: 'string',
        cardHandle: 'string',
        pinStatus: 'string',
        certificate: 'mocked-hba-cert',
        iccsn: 'string',
      },
      [ECardTypes.SMCB]: {
        cardType: ECardTypes.SMCB,
        ctId: 'string',
        slotNr: 'string',
        cardHandle: 'string',
        pinStatus: 'string',
        certificate: 'mocked-smcb-cert',
        iccsn: 'string',
      },
    };
  });

  it('should sign challenge successfully for HBA', async () => {
    const jwsSignature = 'mocked-jws-signature-hba';
    mockStoreDispatch.mockResolvedValueOnce(jwsSignature);

    await expect(wrapper.vm.signChallengeForCardType(ECardTypes.HBA)).resolves.toBeUndefined();

    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/getSignedAuthChallenge', {
      cardType: ECardTypes.HBA,
      challenge: 'mocked-challenge',
      certificate: 'mocked-hba-cert',
    });
    expect(mockStoreCommit).toHaveBeenCalledWith('idpServiceStore/setHbaJwsSignature', jwsSignature);
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should sign challenge successfully for SMCB', async () => {
    const jwsSignature = 'mocked-jws-signature-smcb';
    mockStoreDispatch.mockResolvedValueOnce(jwsSignature);

    await expect(wrapper.vm.signChallengeForCardType(ECardTypes.SMCB)).resolves.toBeUndefined();

    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/getSignedAuthChallenge', {
      cardType: ECardTypes.SMCB,
      challenge: 'mocked-challenge',
      certificate: 'mocked-smcb-cert',
    });
    expect(mockStoreCommit).toHaveBeenCalledWith('idpServiceStore/setSmcbJwsSignature', jwsSignature);
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should handle error by calling handleErrors and throwing AuthFlowError', async () => {
    const error = new Error('Some error');
    mockStoreDispatch.mockRejectedValueOnce(error);

    await expect(wrapper.vm.signChallengeForCardType(ECardTypes.HBA)).rejects.toThrow(AuthFlowError);

    // Dispatch is called but fails
    expect(mockStoreDispatch).toHaveBeenCalledWith('connectorStore/getSignedAuthChallenge', {
      cardType: ECardTypes.HBA,
      challenge: 'mocked-challenge',
      certificate: 'mocked-hba-cert',
    });

    // handleErrors is called
    expect(spyHandleErrors).toHaveBeenCalledWith(error);

    // alertDefinedErrorWithDataOptional is called with AUTHCL_1108
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1108);

    // The thrown error should have error code AUTHCL_1108 and SERVER_ERROR type
    try {
      await wrapper.vm.signChallengeForCardType(ECardTypes.HBA);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthFlowError);
      const authFlowErr = err as AuthFlowError;
      expect(authFlowErr.message).toContain(`(${ERROR_CODES.AUTHCL_1108})`);
      expect(authFlowErr.errorType).toBe(OAUTH2_ERROR_TYPE.SERVER_ERROR);
    }
  });
});
