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

import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { launch as pinStatusLauncher } from '@/renderer/modules/connector/connector_impl/get-pin-status-launcher';
import cardHandleParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { TPinStatusResponse, TPinStatusTypes } from '@/renderer/modules/connector/type-definitions';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

let statusResult: string, pinStatus: TPinStatusTypes;
export const getPinStatus = async (
  cardType: ECardTypes,
  cardHandle: string,
  returnValue = false,
): Promise<TPinStatusResponse> => {
  try {
    const pinStatusResp = await pinStatusLauncher(cardType, cardHandle);
    statusResult = cardHandleParser(pinStatusResp, XML_TAG_NAMES.TAG_VERIFY_RESULT);
    logger.debug(`statusResult: ${statusResult}`);
    pinStatus = cardHandleParser(pinStatusResp, XML_TAG_NAMES.TAG_PINSTATUS) as TPinStatusTypes;
    logger.debug(`pinStatus: ${pinStatus}`);
    if (returnValue) {
      return { statusResult, pinStatus };
    }
    if (pinStatus === 'BLOCKED' || pinStatus === 'REJECTED') {
      throw new UserfacingError('Technical error pin status not verified', '', ERROR_CODES.AUTHCL_1103, {
        cardType,
      });
    }
    if (pinStatus === 'TRANSPORT_PIN') {
      throw new UserfacingError('Technical error pin status not verified', '', ERROR_CODES.AUTHCL_1120, {
        cardType,
      });
    }
    return { statusResult, pinStatus };
  } catch (error) {
    logger.error('An error occurred while getting PIN status:', error.message);
    throw error;
  }
};
