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

import { logger } from '@/renderer/service/logger';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { UserfacingError } from '@/renderer/errors/errors';
import { findSpecificElementInResponseProperties } from '@/renderer/modules/connector/common/soap-response-json-parser';
import { ERROR_CODES } from '@/error-codes';

export async function findAvailableCardTerminals(xmlSoapResponse: string): Promise<{ [name: string]: any }> {
  const cardTerminals = await findSpecificElementInResponseProperties(xmlSoapResponse, XML_TAG_NAMES.TAG_CARD_TERMINAL);
  if (cardTerminals == null) {
    logger.error('No Card terminals found, response from connector', xmlSoapResponse);
    throw new UserfacingError('Technical error', 'No Card-Terminals found', ERROR_CODES.AUTHCL_1113);
  }
  return cardTerminals;
}
