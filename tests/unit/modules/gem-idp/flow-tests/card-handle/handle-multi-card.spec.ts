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
import { AuthFlowError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import * as utils from '@/renderer/utils/utils';
import { LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION } from '@/constants';

const FOUND_CARDS_DATA = [
  {
    CardType: ECardTypes.SMCB,
    CardHandle: 'smcb-handle',
    CtId: 'ct-1',
    SlotId: 1,
    Iccsn: 'iccsn-smcb',
    CardHolderName: 'SMCB Holder',
  },
  {
    CardType: ECardTypes.SMCB,
    CardHandle: 'smcb-handle-2',
    CtId: 'ct-2',
    SlotId: 2,
    Iccsn: 'iccsn-smcb-2',
    CardHolderName: 'SMCB2 Holder',
  },
];

jest.spyOn(window.api, 'focusToApp').mockReturnValue(undefined);

describe('GetCardHandle handleMultiCard', () => {
  let wrapper: VueWrapper<InstanceType<typeof GetCardHandle>>;
  let mockStoreCommit: jest.SpyInstance;
  let spyAlertLoginResultWithIconAndTimer: jest.SpyInstance;
  let spyShowMultiCardSelectDialogModal: jest.SpyInstance;

  // We'll store a reference to the global pendingCardActionModalClose to restore later.
  let originalPendingCardActionModalClose: any;

  beforeAll(() => {
    // CardHandle.vue uses a module-level variable: pendingCardActionModalClose
    // We must ensure we have a reference to restore it after tests.
    originalPendingCardActionModalClose = (global as any).pendingCardActionModalClose;
  });

  afterAll(() => {
    // Restore the original reference after all tests are done.
    (global as any).pendingCardActionModalClose = originalPendingCardActionModalClose;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockStoreCommit = jest.spyOn(store, 'commit');
    spyAlertLoginResultWithIconAndTimer = jest.spyOn(utils, 'alertLoginResultWithIconAndTimer').mockResolvedValue();
    spyShowMultiCardSelectDialogModal = jest.spyOn<any, any>(GetCardHandle.methods, 'showMultiCardSelectDialogModal');

    wrapper = shallowMount(GetCardHandle, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: jest.fn(),
      },
    });

    // By default, no pending modal close function
    (global as any).pendingCardActionModalClose = undefined;
  });

  it('should set multiCardList, selectedCardType, close any pending modal, show multi card dialog, and commit card data on success', async () => {
    const err = {
      data: {
        foundCards: FOUND_CARDS_DATA,
      },
    };

    // We'll resolve the showMultiCardSelectDialogModal with the first card in the list
    setTimeout(() => {
      wrapper.vm.selectCardPromises.resolve(FOUND_CARDS_DATA[0]);
    }, 100);

    await wrapper.vm.handleMultiCard(err);

    // multiCardList and selectedCardType should be set
    expect(wrapper.vm.multiCardList).toEqual(err.data.foundCards);
    expect(wrapper.vm.selectedCardType).toBe(ECardTypes.SMCB);

    // showMultiCardSelectDialogModal should be called
    expect(spyShowMultiCardSelectDialogModal).toHaveBeenCalled();

    // After successful selection, showMultiCardSelectModal should be false
    expect(wrapper.vm.showMultiCardSelectModal).toBe(false);

    // The chosen card is SMCB, so commit setSmcbCardData
    expect(mockStoreCommit).toHaveBeenCalledWith('connectorStore/setSmcbCardData', {
      cardHandle: 'smcb-handle',
      ctId: 'ct-1',
      slotNr: 1,
      cardType: 'SMC-B',
      iccsn: 'iccsn-smcb',
    });

    expect(spyAlertLoginResultWithIconAndTimer).not.toHaveBeenCalled();
  });

  it('should handle rejection from showMultiCardSelectDialogModal by showing alert and throwing AuthFlowError', async () => {
    const err = {
      data: {
        foundCards: [FOUND_CARDS_DATA[0]],
      },
    };

    // Check that an AuthFlowError with ACCESS_DENIED is thrown
    try {
      setTimeout(() => {
        wrapper.vm.selectCardPromises.reject();
      }, 100);

      await wrapper.vm.handleMultiCard(err);
    } catch (error) {
      expect(error).toBeInstanceOf(AuthFlowError);
      const authFlowError = error as AuthFlowError;
      expect(authFlowError.errorType).toBe(OAUTH2_ERROR_TYPE.ACCESS_DENIED);
      expect(authFlowError.message).toBe('User cancelled the card selection');
    }

    // // showMultiCardSelectDialogModal is called
    expect(spyShowMultiCardSelectDialogModal).toHaveBeenCalled();

    // // alertLoginResultWithIconAndTimer should be called with correct arguments
    expect(spyAlertLoginResultWithIconAndTimer).toHaveBeenCalledWith(
      'error',
      LOGIN_CANCELLED_BY_USER,
      SHOW_DIALOG_DURATION,
    );

    // // No commit should occur on rejection
    expect(mockStoreCommit).not.toHaveBeenCalled();
  });
});
