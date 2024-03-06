/*
 * Copyright 2023 gematik GmbH
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

import { logger } from '@/renderer/service/logger';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { ConnectorError, ConnectorHint } from '@/renderer/errors/errors';
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
      `keine ${cardType.toUpperCase()}-Karten gefunden`,
    );
  }

  if (Array.isArray(foundCards) && foundCards.length > 1 && result === 'OK') {
    throw new ConnectorHint(
      ERROR_CODES.AUTHCL_1105,
      'Konnektor Hinweis-Fehler',
      `Mehrere ${cardType.toUpperCase()}-Karten als gesteckt gefunden!`,
      { foundCards, cardType },
    );
  }
}
