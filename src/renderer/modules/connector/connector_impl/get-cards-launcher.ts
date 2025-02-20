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

import ConnectorConfig from './connector-config';
import * as getCardsObj from './get-cards';
import * as sdsRequestObj from './sds-request';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import soapRespParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { checkGetCards } from '@/renderer/modules/connector/connector_impl/lookup-get-cards';
import { TCardData } from '@/renderer/modules/connector/type-definitions';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';
import { ConnectorHint } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

const executeService = async (endpoint: string, cardType: ECardTypes) => {
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);
  return getCardsObj.runSoapRequest(
    ConnectorConfig.contextParameters,
    endpointMapped,
    ConnectorConfig.cardsParametersByType(cardType),
  );
};

export const launch = async (cardType: ECardTypes): Promise<Partial<TCardData>> => {
  let cardsResponse;

  try {
    const endpoint = await sdsRequestObj.getServiceEndpointTls(XML_TAG_NAMES.TAG_EVENT_SERVICE);
    logger.debug(`Using event service endpoint ${endpoint} to send SDS requests to connector.`);
    cardsResponse = await executeService(endpoint, cardType);
    logger.debug(`Response to GetCard-request for ${cardType.toUpperCase()}-Card is: ${cardsResponse}`);
    await checkGetCards(cardsResponse, cardType);
    const cardHandle = soapRespParser(cardsResponse, XML_TAG_NAMES.TAG_CARD_HANDLE);
    const cardSlotId = soapRespParser(cardsResponse, XML_TAG_NAMES.TAG_CARD_SLOT);
    const cardTerminalId = soapRespParser(cardsResponse, XML_TAG_NAMES.TAG_CARD_TERMINAL_ID);
    const iccsn = soapRespParser(cardsResponse, XML_TAG_NAMES.TAG_CARD_ICCSN);
    logger.debug(`${cardType.toUpperCase()}-Card found: `, {
      cardHandle,
      cardTerminalId,
      cardSlotId,
      iccsn,
    });
    return {
      cardHandle: cardHandle,
      ctId: cardTerminalId,
      slotNr: cardSlotId,
      cardType: cardType,
      iccsn: iccsn,
    };
  } catch (err) {
    if (err.code === ERROR_CODES.AUTHCL_1105) {
      const foundCards = err.data.foundCards;
      const cardType = err.data.cardType;
      throw new ConnectorHint(
        ERROR_CODES.AUTHCL_1105,
        'Konnektor Hinweis-Fehler',
        `Mehrere ${cardType.toUpperCase()}-Karten als gesteckt gefunden!`,
        { foundCards, cardType },
      );
    } else {
      logger.error('Error getting card from connector: ', err.message);
      throw checkSoapError(err?.response?.body) || err;
    }
  }
};
