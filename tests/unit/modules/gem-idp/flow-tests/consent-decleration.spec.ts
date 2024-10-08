/*
 * Copyright 2024 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
 */

import { shallowMount } from '@vue/test-utils';
import Swal from 'sweetalert2';

import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import '@/renderer/modules/gem-idp/store/gem-idp-service-store';

const CLIENT_ID = 'some-client-id';
const EXAMPLE_CARD_DATA = {
  cardHandle: '',
  cardType: 'HBA',
  ctId: '',
  iccsn: 'some-uniq-data',
  slotNr: '',
};

describe('GemIdpAuthFlowProcess.vue', () => {
  const wrapper = shallowMount(GemIdpAuthFlowProcess, {
    global: {
      plugins: [store, i18n],
    },
    data() {
      return {
        currentCardType: ECardTypes.HBA,
      };
    },
  });

  beforeEach(() => {
    // first reset stores
    store.commit('connectorStore/resetStore');
    store.commit('gemIdpServiceStore/resetStore');

    store.commit('connectorStore/setHbaCardData', EXAMPLE_CARD_DATA);
    store.commit('gemIdpServiceStore/setClientId', CLIENT_ID);

    wrapper.vm.userSavedConsent = false;

    // @ts-ignore
    localStorage.clear();
  });

  it('saves to local storage if user choose to save the consent', async () => {
    mockSwal(true);
    setClaims(true);

    wrapper.vm.userSavedConsent = true;
    expect(await wrapper.vm.showConsentDeclaration()).toBe(true);
    expect(Swal.fire).toHaveBeenCalledTimes(1);

    // on the second call swal should not be called
    expect(await wrapper.vm.showConsentDeclaration()).toBe(true);
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it('returns true if user clicks confirm', async () => {
    mockSwal(true);
    setClaims(true);

    const userConsent = store.state.gemIdpServiceStore.userConsent;

    // expect that await wrapper.vm.showConsentDeclaration() returns true
    expect(await wrapper.vm.showConsentDeclaration()).toBe(true);

    // expect that swal called with correct params
    expect(Swal.fire).toHaveBeenCalledWith({
      title: wrapper.vm.$t('privacy_notice'),
      html: wrapper.vm.renderConsentItemList(wrapper.vm.$t('consent_claims_title'), userConsent!.requested_claims),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: wrapper.vm.$t('accept_consent'),
      cancelButtonText: wrapper.vm.$t('decline_consent'),
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      width: '60%',
    });
  });

  it('throws error if user clicks cancel', async () => {
    mockSwal(false);
    setClaims(true);

    // expect that await wrapper.vm.showConsentDeclaration() throws error
    await expect(async () => {
      await wrapper.vm.showConsentDeclaration();
    }).rejects.toThrow();
  });
});

const mockSwal = (isConfirmed: boolean) => {
  jest.spyOn(Swal, 'fire').mockImplementation(() => {
    return Promise.resolve({
      isConfirmed,
      isDismissed: false,
      isDenied: false,
      value: true,
    });
  });
};

const setClaims = (claimsExists: boolean) => {
  const claims = !claimsExists
    ? {}
    : {
        requested_scopes: {
          'some-scope': 'some-scope',
        },
        requested_claims: {
          'some-claim': 'some-claim',
        },
      };

  store.commit('gemIdpServiceStore/setUserConsent', claims);
};
