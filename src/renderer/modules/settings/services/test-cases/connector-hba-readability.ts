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

function getErrorMessage(status: string, slotNr: string, cardTerminalId: string) {
  let errorMessage: string;
  if (status === 'TRANSPORT_PIN') {
    errorMessage = translate('readability_test_hba_transport_pin', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'BLOCKED') {
    errorMessage = translate('readability_test_hba_blocked', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'EMPTY_PIN') {
    errorMessage = translate('readability_test_hba_empty_pin', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'DISABLED') {
    errorMessage = translate('readability_test_hba_disabled', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else {
    errorMessage = translate('readability_test_hba_unknown_pin_status', { status: status });
  }
  return errorMessage;
}
