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

import i18n from '@/renderer/i18n';
import { TSoapFault } from '@/renderer/modules/connector/type-definitions';

const translate = i18n.global.t;

export function getErrorMessage(status: string, slotNr: string, cardTerminalId: string, soapFault?: TSoapFault) {
  let errorMessage: string;
  if (status === 'TRANSPORT_PIN') {
    errorMessage = translate('readability_test_transport_pin', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'BLOCKED') {
    errorMessage = translate('readability_test_blocked', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'EMPTY_PIN') {
    errorMessage = translate('readability_test_empty_pin', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'DISABLED') {
    errorMessage = translate('readability_test_disabled', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'VERIFIABLE') {
    errorMessage = translate('readability_test_smcb_verifiable', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (soapFault && (soapFault.code || soapFault.faultstring)) {
    errorMessage = `${soapFault.faultstring || ''} ${soapFault.code || 'unknown'}`;
  } else {
    errorMessage = translate('readability_test_unknown_pin_status');
  }
  return errorMessage;
}
