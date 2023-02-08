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
  logger.info(`Sending SOAP request to ${endpoint} to get PIN status for from connector.`);
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
