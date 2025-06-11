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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { XML_ERROR_TAG_NAMES, XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from './connector-config';
import { runSoapRequest } from './verify-pin';
import { getServiceEndpointTls } from './sds-request';
import { logger } from '@/renderer/service/logger';
import cardHandleParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { TCardData, TCardTerminal } from '@/renderer/modules/connector/type-definitions';

/**
 * @param endpoint
 * @param cardHandle
 * @param pinType
 * @returns {Promise<void>}
 */
export const verifyPin = async (endpoint: string, cardHandle: string, pinType: string): Promise<string> => {
  return await runSoapRequest(ConnectorConfig.contextParameters, endpoint, cardHandle, pinType);
};

export const launch = async (terminals: TCardTerminal, cardData: TCardData): Promise<string> => {
  let cardServiceEndpoint, statusResult;
  try {
    cardServiceEndpoint = await getServiceEndpointTls(XML_TAG_NAMES.TAG_CARD_SERVICE);
    logger.debug(`Using card service endpoint ${cardServiceEndpoint} to send SDS requests to connector.`);
    checkRemotePIN(terminals, cardData);
    const statusVerifyResponse = await verifyPin(
      cardServiceEndpoint,
      cardData.cardHandle,
      ConnectorConfig.cardsParametersByType(cardData.cardType).pinType,
    );
    logger.debug(`verifyPinResp: ${statusVerifyResponse}`);
    statusResult = cardHandleParser(statusVerifyResponse, XML_TAG_NAMES.TAG_VERIFY_RESULT);
    if (statusResult !== 'OK') {
      checkSoapError(statusVerifyResponse);
      logger.warn(
        'VerifyPIN response warning :',
        cardHandleParser(statusVerifyResponse, XML_ERROR_TAG_NAMES.TAG_ERROR_MESSAGE),
      );
    }
    return statusVerifyResponse;
  } catch (err) {
    const loggerError = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
    logger.error('Error getting VerifyPIN Status from connector', loggerError);
    throw checkSoapError(err.response?.body) || err;
  }
};

export function checkRemotePIN(terminals: TCardTerminal | TCardTerminal[], card: TCardData): void {
  logger.debug('Check RemotePIN for CardData ', JSON.stringify(card));
  if (!Array.isArray(terminals)) {
    terminals = [terminals];
  }
  const terminalData = terminals.filter(
    (item: TCardTerminal) => item.CtId === card.ctId && item.WorkplaceIds.WorkplaceId === '',
  );
  if (terminalData.length > 0) {
    logger.warn('Remote VerifyPIN is not supported', terminalData);
    throw new UserfacingError('Remote VerifyPIN is not supported', '', ERROR_CODES.AUTHCL_1104, {
      cardType: card.cardType,
      terminal: card.ctId,
    });
  }
}
