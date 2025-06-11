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
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { AuthFlowError } from '@/renderer/errors/errors';
import * as utils from '@/renderer/utils/utils';
import createJwe from '@/renderer/modules/gem-idp/sign-feature/create-jwe';
import jsonwebtoken from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  decode: jest.fn(),
}));

jest.mock('@/renderer/modules/gem-idp/sign-feature/create-jwe', () => jest.fn());
const IDP_ENC_JWK = {
  use: 'string',
  kid: 'string',
  kty: 'RSA',
  crv: 'string',
  x: 'string',
  y: 'string',
};

describe('ConnectorActions setSignature', () => {
  let wrapper: VueWrapper<InstanceType<typeof ConnectorActions>>;
  let spyHandleErrors: jest.SpyInstance;
  let spyAlertDefinedError: jest.SpyInstance;
  let mockStoreCommit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    spyHandleErrors = jest.fn();
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional').mockResolvedValue();
    mockStoreCommit = jest.spyOn(store, 'commit');

    wrapper = shallowMount(ConnectorActions, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: spyHandleErrors as any,
      },
    });

    store.state.idpServiceStore.jwsHbaSignature = 'mock-hba-signature';
    store.state.idpServiceStore.jwsSmcbSignature = 'mock-smcb-signature';
    store.state.idpServiceStore.idpEncJwk = IDP_ENC_JWK;
    store.state.idpServiceStore.challenge = 'mocked-challenge-token';

    (jsonwebtoken.decode as jest.Mock).mockReturnValue({ exp: 1234567890 });
  });

  it('should set jwe challenge successfully when signature and idpEncJwk are present', async () => {
    (createJwe as jest.Mock).mockResolvedValueOnce('mocked-jwe');

    await expect(wrapper.vm.setSignature(ECardTypes.HBA)).resolves.toBeUndefined();

    // createJwe should be called with (signature, idpEncJwk, exp)
    expect(createJwe).toHaveBeenCalledWith('mock-hba-signature', IDP_ENC_JWK, 1234567890);

    // commit should be called with 'idpServiceStore/setJweChallenge', 'mocked-jwe'
    expect(mockStoreCommit).toHaveBeenCalledWith('idpServiceStore/setJweChallenge', 'mocked-jwe');

    // no errors
    expect(spyHandleErrors).not.toHaveBeenCalled();
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
  });

  it('should handle errors, call handleErrors, show alert and throw AuthFlowError if createJwe fails', async () => {
    const error = new Error('CreateJwe failed');
    (createJwe as jest.Mock).mockRejectedValueOnce(error);

    await expect(wrapper.vm.setSignature(ECardTypes.SMCB)).rejects.toThrow(AuthFlowError);

    // handleErrors should be called
    expect(spyHandleErrors).toHaveBeenCalledWith(error);

    // alertDefinedErrorWithDataOptional should be called with AUTHCL_0013
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0013);

    // AuthFlowError should be thrown with correct code and type
    try {
      await wrapper.vm.setSignature(ECardTypes.SMCB);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthFlowError);
      const authErr = err as AuthFlowError;
      expect(authErr.message).toContain(`(${ERROR_CODES.AUTHCL_0013})`);
      expect(authErr.errorType).toBe(OAUTH2_ERROR_TYPE.ACCESS_DENIED);
    }
  });
});
