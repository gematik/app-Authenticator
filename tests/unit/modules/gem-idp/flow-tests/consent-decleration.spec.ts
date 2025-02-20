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

import { shallowMount } from '@vue/test-utils';
import Swal from 'sweetalert2';

import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import '@/renderer/modules/gem-idp/store/idp-service-store';
import { renderConsentItemList, showConsentDeclaration } from '@/renderer/modules/gem-idp/utils/consent-declaration';
import { TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import { mockSwal } from '@tests/utils';

const CLIENT_ID = 'some-client-id';
const EXAMPLE_CARD_DATA = {
  cardHandle: '',
  cardType: 'HBA',
  ctId: '',
  iccsn: 'some-uniq-data',
  slotNr: '',
};

describe('AuthFlow Tests -> Consent Declaration', () => {
  const wrapper = shallowMount(AuthFlow, {
    global: {
      plugins: [store, i18n],
    },
    data() {
      return {
        authArguments: {
          deeplink: '',
          callbackType: TCallback.OPEN_TAB,
          challengePath: '',
          cardType: ECardTypes.HBA,
          clientId: '',
        },
      };
    },
  });

  beforeEach(() => {
    // first reset stores
    store.commit('connectorStore/resetStore');
    store.commit('idpServiceStore/resetStore');

    store.commit('connectorStore/setHbaCardData', EXAMPLE_CARD_DATA);
    store.commit('idpServiceStore/setClientId', CLIENT_ID);

    localStorage.clear();

    // change the exported userSavedConsent variable to true from consent-declaration.ts
    import('@/renderer/modules/gem-idp/utils/consent-declaration').then((module) => {
      module.userSavedConsent = true;
    });
  });

  it('saves to local storage if user choose to save the consent', async () => {
    mockSwal(true);
    setClaims(true);

    expect(await showConsentDeclaration(wrapper.vm.authArguments.cardType!, store, wrapper.vm.$t)).toBe(true);
    expect(Swal.fire).toHaveBeenCalledTimes(1);

    // on the second call swal should not be called
    expect(await showConsentDeclaration(wrapper.vm.authArguments.cardType!, store, wrapper.vm.$t)).toBe(true);
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it('returns true if user clicks confirm', async () => {
    mockSwal(true);
    setClaims(true);

    const userConsent = store.state.idpServiceStore.userConsent;

    // expect that swal called with correct params
    expect(Swal.fire).toHaveBeenCalledWith({
      title: wrapper.vm.$t('privacy_notice'),
      html: renderConsentItemList(wrapper.vm.$t('consent_claims_title'), userConsent!.requested_claims, wrapper.vm.$t),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: wrapper.vm.$t('accept_consent'),
      cancelButtonText: wrapper.vm.$t('decline_consent'),
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      width: '60%',
    });

    // expect that await showConsentDeclaration returns true
    expect(await showConsentDeclaration(wrapper.vm.authArguments.cardType!, store, wrapper.vm.$t)).toBe(true);
  });

  it('throws error if user clicks cancel', async () => {
    mockSwal(false);
    setClaims(true);

    // expect that await wrapper.vm.showConsentDeclaration() throws error
    await expect(async () => {
      await showConsentDeclaration(wrapper.vm.authArguments.cardType!, store, wrapper.vm.$t);
    }).rejects.toThrow();
  });
});

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

  store.commit('idpServiceStore/setUserConsent', claims);
};
