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
import GetCardHandle from '@/renderer/modules/gem-idp/components/CardHandle.vue';
import { CONNECTOR_ERROR_CODES, ERROR_CODES } from '@/error-codes';
import { ConnectorError } from '@/renderer/errors/errors';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import * as utils from '@/renderer/utils/utils';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { getUserIdForCard } from '@/renderer/utils/get-userId-for-card';
import { mockSwal } from '@tests/utils';
import * as getCardLauncher from '@/renderer/modules/connector/connector_impl/get-cards-launcher';
import { TCardData } from '@/renderer/modules/connector/type-definitions';

describe('GetCardHandle getCardHandle', () => {
  let wrapper: VueWrapper<InstanceType<typeof GetCardHandle>>;
  let mockDispatch: jest.SpyInstance;
  let spyAlertDefinedError: jest.SpyInstance;
  let spyHandleErrors: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.spyOn(store, 'dispatch');
    spyAlertDefinedError = jest.spyOn(utils, 'alertDefinedErrorWithDataOptional');
    spyHandleErrors = jest.fn();

    wrapper = shallowMount(GetCardHandle, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: spyHandleErrors as any,
      },
    });
  });

  it('should dispatch "connectorStore/getCardHandle" and succeed', async () => {
    mockDispatch.mockResolvedValueOnce(undefined);

    await expect(wrapper.vm.getCardHandle(ECardTypes.HBA)).resolves.toBeUndefined();

    expect(mockDispatch).toHaveBeenCalledWith('connectorStore/getCardHandle', ECardTypes.HBA);
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(spyHandleErrors).not.toHaveBeenCalled();
  });

  it('should handle AUTHCL_1105 error and call handleMultiCard', async () => {
    const multiCardError = new ConnectorError(ERROR_CODES.AUTHCL_1105, 'Multi-card error', 'details', {
      foundCards: [
        { CardType: ECardTypes.SMCB, Iccsn: '12345' },
        { CardType: ECardTypes.HBA, Iccsn: '67890' },
      ],
    });
    const spyHandleMultiCard = jest.spyOn(wrapper.vm, 'handleMultiCard').mockResolvedValueOnce(undefined);

    mockDispatch.mockRejectedValueOnce(multiCardError);

    await expect(wrapper.vm.getCardHandle(ECardTypes.SMCB)).resolves.toBeUndefined();

    expect(mockDispatch).toHaveBeenCalledWith('connectorStore/getCardHandle', ECardTypes.SMCB);
    expect(spyHandleMultiCard).toHaveBeenCalledWith(multiCardError);
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(spyHandleErrors).not.toHaveBeenCalled();
  });

  it('should handle ConnectorError E4047 and call handleMissingCardAction', async () => {
    mockSwal(false);
    const missingCardError = new ConnectorError(
      CONNECTOR_ERROR_CODES.E4047,
      'Card handle invalid, wrong card or missing pin',
      'details',
    );
    const spyHandleMissingCardAction = jest
      .spyOn(wrapper.vm, 'handleMissingCardAction')
      .mockResolvedValueOnce(undefined);

    mockDispatch.mockRejectedValueOnce(missingCardError);

    await expect(wrapper.vm.getCardHandle(ECardTypes.HBA)).resolves.toBeUndefined();

    expect(mockDispatch).toHaveBeenCalledWith('connectorStore/getCardHandle', ECardTypes.HBA);
    expect(spyHandleMissingCardAction).toHaveBeenCalledWith(ECardTypes.HBA);
    expect(spyAlertDefinedError).not.toHaveBeenCalled();
    expect(spyHandleErrors).not.toHaveBeenCalled();
  });

  it('should call handleErrors and alert for unknown errors', async () => {
    mockSwal(false);
    const genericError = new Error('Generic error');

    mockDispatch.mockRejectedValueOnce(genericError);

    await expect(wrapper.vm.getCardHandle(ECardTypes.SMCB)).rejects.toThrow(
      `Error occurred while reading card information (${ERROR_CODES.AUTHCL_1001})`,
    );

    expect(mockDispatch).toHaveBeenCalledWith('connectorStore/getCardHandle', ECardTypes.SMCB);
    expect(spyHandleErrors).toHaveBeenCalledWith(genericError);
    expect(spyAlertDefinedError).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_1001);
  });

  it('should set context parameters for HBA card', async () => {
    const MOCK_DATA: Partial<TCardData> = {
      iccsn: 'mocked-iccsn',
    };
    jest.spyOn(getCardLauncher, 'launch').mockResolvedValueOnce(MOCK_DATA);

    await wrapper.vm.getCardHandle(ECardTypes.HBA);

    expect(store.state.connectorStore.cards.HBA?.iccsn).toBe(MOCK_DATA.iccsn);
    expect(ConnectorConfig.contextParameters.userId).toBe(getUserIdForCard(MOCK_DATA.iccsn as string));
  });
});
