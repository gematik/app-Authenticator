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

import { logger } from '@/renderer/service/logger';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { ConnectorError, UserfacingError } from '@/renderer/errors/errors';
import { findSpecificElementInResponseProperties } from '@/renderer/modules/connector/common/soap-response-json-parser';
import soapRespParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { CONNECTOR_ERROR_CODES, ERROR_CODES } from '@/error-codes';

export async function checkGetCards(xmlSoapResponse: string, cardType: string): Promise<void> {
  const result = soapRespParser(xmlSoapResponse, XML_TAG_NAMES.TAG_GETCARD_STATUS_RESULT);
  const foundCards = await findSpecificElementInResponseProperties(xmlSoapResponse, XML_TAG_NAMES.TAG_ITEM_CARD);
  logger.debug(` get cards found - ${JSON.stringify(foundCards)} -`);
  if (foundCards == null && result === 'OK') {
    logger.error(`Connector error occurred. No cards for card type ${cardType.toUpperCase()} found.`);
    throw new ConnectorError(
      CONNECTOR_ERROR_CODES.E4047,
      'Konnektor Hinweis-Fehler',
      `keine ${cardType.toUpperCase()}-Karten gefunden.`,
    );
  }
  if (Array.isArray(foundCards) && foundCards.length > 1 && result === 'OK') {
    logger.error(`Connector error occurred. Several cards for card type ${cardType.toUpperCase()} found!`);
    throw new UserfacingError(
      'Konnektor Hinweis-Fehler',
      `Mehrere ${cardType.toUpperCase()}-Karten als gesteckt gefunden!`,
      ERROR_CODES.AUTHCL_1105,
      { cardType },
    );
  }
}
