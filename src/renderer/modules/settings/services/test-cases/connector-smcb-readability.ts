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

import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { launch as getCards } from '@/renderer/modules/connector/connector_impl/get-cards-launcher';
import { ConnectorError } from '@/renderer/errors/errors';
import { logger } from '@/renderer/service/logger';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { ERROR_CODES } from '@/error-codes';
import i18n from '@/renderer/i18n';
import { getPinStatus } from '@/renderer/modules/connector/connector_impl/check-pin-status';
import { getErrorMessage } from '@/renderer/modules/settings/services/utils/get-smartcard-pinstatus-errormessages';

export async function connectorSmcbReadabilityTest(): Promise<TestResult> {
  const translate = i18n.global.t;
  try {
    const cardSmcbInfo = await getCards(ECardTypes.SMCB);
    const pinStatus = await getPinStatus(ECardTypes.SMCB, cardSmcbInfo.cardHandle!, true);
    logger.info('SMC-B PinStatus: ' + pinStatus.pinStatus);

    const errorMessage = getErrorMessage(pinStatus.pinStatus, cardSmcbInfo.slotNr!, cardSmcbInfo.ctId!);
    if (pinStatus.pinStatus !== 'VERIFIED') {
      return {
        title: translate('function_test_general'),
        name: translate('smcb_availability'),
        status: TestStatus.failure,
        details: errorMessage,
      };
    }
    return {
      title: translate('function_test_general'),
      name: translate('smcb_availability'),
      status: TestStatus.success,
      details: translate('smcb_found_in_card_terminal', { slotNr: cardSmcbInfo.slotNr, ctId: cardSmcbInfo.ctId }),
    };
  } catch (err) {
    logger.debug(err.message);

    if (err.code === ERROR_CODES.AUTHCL_1105) {
      logger.debug('Multiple SMCBs found, no error');
      return {
        title: translate('function_test_general'),
        name: translate('smcb_availability'),
        status: TestStatus.success,
        details: translate('readability_test_Multi_SMCBs'),
      };
    }

    const details =
      err instanceof ConnectorError
        ? translate('error_info') + `${err.code}, ${err.description} `
        : translate('error_info') + `${err.message} `;
    return {
      title: translate('function_test_general'),
      name: translate('smcb_availability'),
      status: TestStatus.failure,
      details: details,
    };
  }
}
