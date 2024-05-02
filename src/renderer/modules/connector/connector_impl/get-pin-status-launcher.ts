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

import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from './connector-config';
import * as getPinStatus from '@/renderer/modules/connector/connector_impl/get-pin-status';
import * as connectorSdsRequest from './sds-request';
import { logger } from '@/renderer/service/logger';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

/**
 * @param endpoint
 * @param cardHandle
 * @param pinType
 * @returns {Promise<void>}
 */
export const pinStatus = async (endpoint: string, cardHandle: string, pinType: string): Promise<string> => {
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);
  return getPinStatus.runSoapRequest(ConnectorConfig.contextParameters, endpointMapped, cardHandle, pinType);
};

export const launch = async (cardType: ECardTypes, cardHandle: string): Promise<string> => {
  try {
    const cardServiceEndpoint = await connectorSdsRequest.getServiceEndpointTls(XML_TAG_NAMES.TAG_CARD_SERVICE);
    logger.debug(`Using service endpoint ${cardServiceEndpoint} to send SDS requests to connector.`);
    return await pinStatus(cardServiceEndpoint, cardHandle, ConnectorConfig.cardsParametersByType(cardType).pinType);
  } catch (err) {
    logger.error('Error getting PIN Status from connector:', err.message);
    throw checkSoapError(err.response?.body) || err;
  }
};
