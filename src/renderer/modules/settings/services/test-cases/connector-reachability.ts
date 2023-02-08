/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { launch as getCardTerminals } from '@/renderer/modules/connector/connector_impl/get-card-terminals-launcher';
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';

const translate = i18n.global.tc;

export async function connectorReachabilityTest(): Promise<TestResult> {
  try {
    const cardTerminals = await getCardTerminals();
    logger.info(`Cardterminal Informationen - ${JSON.stringify(cardTerminals)}`);
    return {
      name: translate('accessibility_of_the_connector'),
      status: TestStatus.success,
      details: translate('accessibility_of_the_connector_successful'),
    };
  } catch (err) {
    logger.debug(err.message);
    return {
      name: translate('accessibility_of_the_connector'),
      status: TestStatus.failure,
      details: translate('error_info') + `${err.message}`,
    };
  }
}
