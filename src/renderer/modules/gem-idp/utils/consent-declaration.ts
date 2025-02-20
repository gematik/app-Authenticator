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
import isEqual from 'lodash/isEqual';
import Swal from 'sweetalert2';

import { alertLoginResultWithIconAndTimer, escapeHTML } from '@/renderer/utils/utils';
import {
  LOGIN_CANCELLED_BY_USER,
  SHOW_DIALOG_DURATION,
  STORAGE_CONFIG_KEYS,
  WIKI_CONSENT_DECLARATION_URL,
} from '@/constants';
import { ERROR_CODES } from '@/error-codes';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { AuthFlowError } from '@/renderer/errors/errors';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

export function renderConsentItemList(title: string, list: Record<string, string>, $t: any): string {
  let consentItemList = '<h2 style="text-align: left; margin: 10px 0">' + title + '</h2>';
  consentItemList += '<ul style="text-align: left ;">';
  for (const value of Object.values(list)) {
    consentItemList += `<li style="list-style: decimal;">- ${escapeHTML(value)}</li>`;
  }
  consentItemList += '</ul>';
  consentItemList += '<br>';

  // render see more information link
  consentItemList += '<div style="text-align: left">';
  consentItemList += $t('here_you_find_more_information');
  consentItemList +=
    '<a href="#" style="color: #0052cc" onclick="window.api.openExternal(\'' + WIKI_CONSENT_DECLARATION_URL + '\')">';
  consentItemList += $t('privacy_notice');

  consentItemList += '</a><br><br>';
  consentItemList += '<input id="save-consent" type="checkbox"> ';
  consentItemList += '<label for="save-consent">' + $t('do_not_show_in_advance') + '</label>';
  consentItemList += '</div>';

  return consentItemList;
}

// keep it here to make it possible to change it in the unit tests
export let userSavedConsent = false;

export async function showConsentDeclaration(currentCardType: ECardTypes, $store: any, $t: any): Promise<boolean> {
  const cardIccsn = $store.state.connectorStore.cards[currentCardType!]!.iccsn;
  const clientId = $store.state.idpServiceStore.clientId;
  const userConsent = $store.state.idpServiceStore.userConsent;

  type TSavedConsents = Record<string, Record<string, string>>;
  const consentPair = clientId + '-' + cardIccsn;

  // if user has already consented for this pair, we skip the consent declaration
  const savedPairs = localStorage.getItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS);
  const savedPairsArray: TSavedConsents = savedPairs ? JSON.parse(savedPairs) : {};

  // if user has already consented for this pair and consents are identical, we skip the consent declaration
  if (savedPairsArray[consentPair] && isEqual(savedPairsArray[consentPair], userConsent?.requested_claims)) {
    return true;
  }

  /**
   * listens for click to save-consent checkbox
   * if this box is checked, we save the consent pair to local storage
   */
  document.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).id === 'save-consent') {
      userSavedConsent = event.target instanceof HTMLInputElement && event.target.checked;
    }
  });

  // bring the app to the front
  window.api.focusToApp();

  const consent = await Swal.fire({
    title: $t('privacy_notice'),
    html: renderConsentItemList($t('consent_claims_title'), userConsent!.requested_claims, $t),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: $t('accept_consent'),
    cancelButtonText: $t('decline_consent'),
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    width: '60%',
  });

  // user clicked cancel, stop the auth process
  if (!consent.isConfirmed) {
    await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
    throw new AuthFlowError(
      `User declined consent (${ERROR_CODES.AUTHCL_0011})`,
      '',
      '',
      true,
      OAUTH2_ERROR_TYPE.ACCESS_DENIED,
    );
  }

  // user clicked save consent, save the pair to local storage
  if (userSavedConsent) {
    // get stored pairs from local storage
    const savedPairs = localStorage.getItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS);

    // parse to array
    const savedPairsObject: TSavedConsents = savedPairs ? JSON.parse(savedPairs) : {};
    savedPairsObject[consentPair] = userConsent!.requested_claims;

    // save to local storage
    localStorage.setItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS, JSON.stringify(savedPairsObject));
  }

  // reset the userSavedConsent for the next call
  userSavedConsent = false;

  return true;
}
