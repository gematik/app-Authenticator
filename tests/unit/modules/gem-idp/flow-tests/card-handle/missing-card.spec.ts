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
import GetCardHandle from '@/renderer/modules/gem-idp/components/CardHandle.vue';
import { ERROR_CODES } from '@/error-codes';
import * as utils from '@/renderer/utils/utils';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import Swal from 'sweetalert2';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

// to make sure we don't wait too long for the sleep
jest.mock('@/constants', () => ({
  ...jest.requireActual('@/constants'),
  AUTH_RE_TRY_TIMEOUT: 500,
}));

describe('GetCardHandle handleMissingCardAction', () => {
  let wrapper: VueWrapper<InstanceType<typeof GetCardHandle>>;
  let spyAlertWithCancelButton: jest.SpyInstance;
  let spyGetCardHandle: jest.SpyInstance;
  let spyAlertLoginResultWithIconAndTimer: jest.SpyInstance;
  let originalPending: any;

  beforeAll(() => {
    // Save original global pendingCardActionModalClose
    originalPending = (global as any).pendingCardActionModalClose;
  });

  afterAll(() => {
    // Restore it after tests
    (global as any).pendingCardActionModalClose = originalPending;
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    spyAlertWithCancelButton = jest.spyOn(utils, 'alertWithCancelButton').mockImplementation(() => {
      return new Promise(() => {}) as any;
    });
    spyAlertLoginResultWithIconAndTimer = jest.spyOn(utils, 'alertLoginResultWithIconAndTimer').mockResolvedValue();

    wrapper = shallowMount(GetCardHandle, {
      global: {
        plugins: [store, i18n],
      },
      props: {
        handleErrors: jest.fn(),
      },
    });

    // We'll mock getCardHandle to track calls
    spyGetCardHandle = jest.spyOn(wrapper.vm, 'getCardHandle').mockResolvedValue(undefined as any);
    (global as any).pendingCardActionModalClose = undefined;
  });

  it('should display alert, set pendingCardActionModalClose, sleep, then call getCardHandle again without user cancellation', async () => {
    await wrapper.vm.handleMissingCardAction(ECardTypes.HBA);

    // alertWithCancelButton should be called with AUTHCL_2001 and cardType HBA
    expect(spyAlertWithCancelButton).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_2001, ECardTypes.HBA);

    // pendingCardActionModalClose should now be set to Swal.close
    expect((global as any).pendingCardActionModalClose).toBe(Swal.close);

    // After sleep resolves, getCardHandle should be called again
    expect(spyGetCardHandle).toHaveBeenCalled();
    expect(spyGetCardHandle).toHaveBeenCalledWith(ECardTypes.HBA);
    expect(spyAlertLoginResultWithIconAndTimer).not.toHaveBeenCalled();
  });

  // todo implement user cancellation
});
