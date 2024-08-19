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
import * as getCardTerminals from './get-card-terminals';
import * as sdsRequestObj from './sds-request';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { findAvailableCardTerminals } from '@/renderer/modules/connector/connector_impl/lookup-card-terminals';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

const executeServiceGc = async (endpoint: string) => {
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);
  return getCardTerminals.runSoapRequest(ConnectorConfig.contextParameters, endpointMapped);
};

export const launch = async (): Promise<{ [name: string]: any }> => {
  try {
    const endpoint = await sdsRequestObj.getServiceEndpointTls(XML_TAG_NAMES.TAG_EVENT_SERVICE);
    logger.debug(`getCardsTerminal.endpoint: ${endpoint}`);

    const xmlSoapResponse = await executeServiceGc(endpoint);
    logger.debug('xmlSoapResponse: ' + xmlSoapResponse);
    return await findAvailableCardTerminals(xmlSoapResponse);
  } catch (err) {
    logger.error('Could not get card terminals: ', err.message);
    throw checkSoapError(err.response?.body) || err;
  }
};
