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
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { getUserIdForCard } from '@/renderer/utils/get-userId-for-card';
import { getErrorMessage } from '@/renderer/modules/settings/services/utils/get-smartcard-pinstatus-errormessages';

const translate = i18n.global.t;

export async function connectorHbaReadabilityTest(): Promise<TestResult> {
  try {
    const cardHbaInfo = await getCards(ECardTypes.HBA);
    if (cardHbaInfo.iccsn) {
      // Get userId for selected Card
      ConnectorConfig.setContextParameters({
        ...ConnectorConfig.contextParameters,
        userId: getUserIdForCard(cardHbaInfo.iccsn),
      });
    }
    const pinStatus = await getPinStatus(ECardTypes.HBA, cardHbaInfo.cardHandle!, true);
    logger.info('HBA PinStatus: ' + pinStatus.pinStatus);

    const errorMessage = getErrorMessage(pinStatus.pinStatus, cardHbaInfo.slotNr!, cardHbaInfo.ctId!);

    if (pinStatus.pinStatus !== 'VERIFIED' && pinStatus.pinStatus !== 'VERIFIABLE') {
      return {
        title: translate('function_test_general'),
        name: translate('hba_availability'),
        status: TestStatus.failure,
        details: errorMessage,
      };
    }

    return {
      title: translate('function_test_general'),
      name: translate('hba_availability'),
      status: TestStatus.success,
      details: translate('hba_found_in_card_terminal', { slotNr: cardHbaInfo.slotNr, ctId: cardHbaInfo.ctId }),
    };
  } catch (err) {
    logger.debug(err.message);

    if (err.code === ERROR_CODES.AUTHCL_1105) {
      logger.debug('Multiple HBA found, no error');
      return {
        title: translate('function_test_general'),
        name: translate('hba_availability'),
        status: TestStatus.success,
        details: translate('readability_test_Multi_HBAs'),
      };
    }

    const details =
      err instanceof ConnectorError
        ? translate('hint') + translate('hba_hint_function_test')
        : translate('hint') + `${err.message} `;
    return {
      title: translate('function_test_general'),
      name: translate('hba_availability'),
      status: TestStatus.warning,
      details: details,
    };
  }
}
