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
import { launch as getCards } from '@/renderer/modules/connector/connector_impl/get-cards-launcher';
import { ConnectorError } from '@/renderer/errors/errors';
import { logger } from '@/renderer/service/logger';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import i18n from '@/renderer/i18n';

const translate = i18n.global.tc;

export async function connectorSmcbReadabilityTest(): Promise<TestResult> {
  try {
    const cardSmcbInfo = await getCards(ECardTypes.SMCB);
    return {
      name: translate('smcb_availability'),
      status: TestStatus.success,
      details: `SMCB in Slot ${cardSmcbInfo.slotNr} vom CardTerminal ${cardSmcbInfo.ctId} gefunden!`,
    };
  } catch (err) {
    logger.debug(err.message);
    // @ts-ignore
    const details =
      err instanceof ConnectorError
        ? translate('error_info') + `${err.code}, ${err.description} `
        : translate('error_info') + `${err.message} `;
    return {
      name: translate('smcb_availability'),
      status: TestStatus.failure,
      details: details,
    };
  }
}
