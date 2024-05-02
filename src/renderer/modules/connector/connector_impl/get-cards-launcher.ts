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
